/**
 * Advanced Email Validation Cloud Functions - SEC-004
 * 高度なメール検証とドメイン確認システム
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const dns = require("dns").promises;
const { SecureLogger } = require("./utils/secure-logger");

// Firebase Admin初期化
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ✅ ユーザー作成時のメール検証と重複チェック
 */
exports.onUserEmailValidation = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;

    try {
      await validateAndTrackEmail(userId, userData.email);

      SecureLogger.info("User email validation completed", undefined, {
        userId,
        email: maskEmail(userData.email),
        reportToService: false,
      });
    } catch (error) {
      SecureLogger.error("User email validation failed", undefined, {
        error,
        userId,
        email: maskEmail(userData.email),
        reportToService: true,
        level: "critical",
      });

      // 検証失敗時はユーザー削除
      await snap.ref.delete();
      throw error;
    }
  });

/**
 * ✅ メール更新時の検証とレート制限
 */
exports.onEmailUpdate = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    // メール変更がある場合のみ処理
    if (before.email !== after.email) {
      try {
        await handleEmailChange(userId, before.email, after.email);

        SecureLogger.info("Email update completed", undefined, {
          userId,
          previousEmail: maskEmail(before.email),
          newEmail: maskEmail(after.email),
        });
      } catch (error) {
        SecureLogger.error("Email update failed", undefined, {
          error,
          userId,
          previousEmail: maskEmail(before.email),
          newEmail: maskEmail(after.email),
          reportToService: true,
          level: "high",
        });

        // 更新を元に戻す
        await change.after.ref.update({ email: before.email });
        throw error;
      }
    }
  });

/**
 * ✅ 定期的な使い捨てメールドメインリスト更新
 */
exports.updateDisposableEmailList = functions.pubsub
  .schedule("0 2 * * *") // 毎日2時に実行
  .onRun(async (context) => {
    try {
      await updateDisposableEmailDomains();

      SecureLogger.info("Disposable email list updated successfully");
    } catch (error) {
      SecureLogger.error("Failed to update disposable email list", undefined, {
        error,
        reportToService: true,
        level: "medium",
      });
    }
  });

/**
 * ✅ MX レコード検証関数
 */
exports.verifyEmailDomain = functions.https.onCall(async (data, context) => {
  // 認証されたユーザーのみ
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { email } = data;

  try {
    const isValid = await verifyDomainMXRecord(email);

    return {
      valid: isValid,
      email: maskEmail(email),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    SecureLogger.error("Domain MX verification failed", undefined, {
      error,
      email: maskEmail(email),
      userId: context.auth.uid,
      reportToService: true,
    });

    throw new functions.https.HttpsError(
      "internal",
      "Domain verification failed",
    );
  }
});

/**
 * メール検証とトラッキング
 */
async function validateAndTrackEmail(userId, email) {
  // 1. 基本フォーマット検証
  if (!isValidEmailFormat(email)) {
    throw new Error("Invalid email format");
  }

  // 2. 使い捨てメール検証
  if (await isDisposableEmail(email)) {
    throw new Error("Disposable email addresses are not allowed");
  }

  // 3. 危険ドメイン検証
  if (await isDangerousDomain(email)) {
    throw new Error("Domain is blacklisted for security reasons");
  }

  // 4. Role-basedメール検証
  if (isRoleBasedEmail(email)) {
    throw new Error("Role-based email addresses are not allowed");
  }

  // 5. MX レコード検証
  if (!(await verifyDomainMXRecord(email))) {
    throw new Error("Email domain does not have valid MX record");
  }

  // 6. 重複チェック
  await checkEmailDuplicate(userId, email);

  // 7. メールインデックス作成
  await createEmailIndex(userId, email);
}

/**
 * メール変更処理
 */
async function handleEmailChange(userId, previousEmail, newEmail) {
  // レート制限チェック
  await checkEmailChangeRateLimit(userId);

  // 新メールアドレス検証
  await validateAndTrackEmail(userId, newEmail);

  // 変更履歴記録
  await recordEmailChange(userId, previousEmail, newEmail);

  // 古いメールインデックス削除
  await removeOldEmailIndex(previousEmail);
}

/**
 * メール変更レート制限チェック
 */
async function checkEmailChangeRateLimit(userId) {
  const changeRef = db.collection("email_changes").doc(userId);
  const changeDoc = await changeRef.get();

  if (changeDoc.exists) {
    const data = changeDoc.data();
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000; // 24時間前

    if (data.lastChange > dayAgo && data.changeCount >= 3) {
      throw new Error(
        "Too many email changes in 24 hours. Please try again later.",
      );
    }
  }
}

/**
 * メール変更履歴記録
 */
async function recordEmailChange(userId, previousEmail, newEmail) {
  const changeRef = db.collection("email_changes").doc(userId);
  const changeDoc = await changeRef.get();

  let changeCount = 1;
  if (changeDoc.exists) {
    const data = changeDoc.data();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    changeCount = data.lastChange > dayAgo ? data.changeCount + 1 : 1;
  }

  await changeRef.set({
    userId,
    changeCount,
    lastChange: Date.now(),
    previousEmail: maskEmail(previousEmail),
    newEmail: maskEmail(newEmail),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * 重複メールチェック
 */
async function checkEmailDuplicate(userId, email) {
  const normalizedEmail = normalizeEmail(email);
  const indexRef = db.collection("email_index").doc(normalizedEmail);
  const indexDoc = await indexRef.get();

  if (indexDoc.exists && indexDoc.data().userId !== userId) {
    throw new Error("Email address is already registered");
  }
}

/**
 * メールインデックス作成
 */
async function createEmailIndex(userId, email) {
  const normalizedEmail = normalizeEmail(email);
  const indexRef = db.collection("email_index").doc(normalizedEmail);

  await indexRef.set({
    userId,
    originalEmail: maskEmail(email),
    normalizedEmail,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * 古いメールインデックス削除
 */
async function removeOldEmailIndex(email) {
  const normalizedEmail = normalizeEmail(email);
  const indexRef = db.collection("email_index").doc(normalizedEmail);
  await indexRef.delete();
}

/**
 * MX レコード検証
 */
async function verifyDomainMXRecord(email) {
  try {
    const domain = email.split("@")[1];
    const mxRecords = await dns.resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    SecureLogger.warn(
      `MX record verification failed for domain: ${email.split("@")[1]}`,
      undefined,
      {
        error: error.message,
      },
    );
    return false;
  }
}

/**
 * 使い捨てメール検証
 */
async function isDisposableEmail(email) {
  const domain = email.split("@")[1].toLowerCase();

  // データベースから最新のブラックリストを取得
  const blacklistRef = db
    .collection("system_config")
    .doc("disposable_email_domains");
  const blacklistDoc = await blacklistRef.get();

  let blacklist = [
    "10minutemail.com",
    "guerrillamail.com",
    "tempmail.org",
    "yopmail.com",
    "mailinator.com",
    "throwaway.email",
    "temp-mail.org",
    "getnada.com",
    "sharklasers.com",
    "maildrop.cc",
  ];

  if (blacklistDoc.exists) {
    blacklist = [...blacklist, ...blacklistDoc.data().domains];
  }

  return blacklist.includes(domain);
}

/**
 * 危険ドメイン検証
 */
async function isDangerousDomain(email) {
  const domain = email.split("@")[1].toLowerCase();

  // 危険ドメインリスト
  const dangerousDomains = [
    "spam-domain.com",
    "phishing-site.net",
    "malware-host.org",
    "blocked-domain.biz",
    "fake-bank.ml",
    "scam-site.ga",
  ];

  // 無料TLDチェック
  const freeTLDs = ["tk", "ml", "ga", "cf"];
  const tld = domain.split(".").pop();

  return dangerousDomains.includes(domain) || freeTLDs.includes(tld);
}

/**
 * Role-basedメール検証
 */
function isRoleBasedEmail(email) {
  const localPart = email.split("@")[0].toLowerCase();
  const rolePrefixes = [
    "admin",
    "administrator",
    "info",
    "support",
    "contact",
    "sales",
    "marketing",
    "webmaster",
    "postmaster",
    "noreply",
    "no-reply",
    "help",
    "service",
    "office",
    "team",
  ];

  return rolePrefixes.includes(localPart);
}

/**
 * 基本メールフォーマット検証
 */
function isValidEmailFormat(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return (
    emailRegex.test(email) &&
    email.length >= 5 &&
    email.length <= 254 &&
    !email.includes("..") &&
    !email.startsWith(".") &&
    !email.includes(".@") &&
    !email.includes("@.")
  );
}

/**
 * メール正規化
 */
function normalizeEmail(email) {
  const [localPart, domain] = email.toLowerCase().split("@");

  if (domain === "gmail.com") {
    // Gmailの場合、+以降を除去し、.を削除
    const cleanLocal = localPart.split("+")[0].replace(/\./g, "");
    return `${cleanLocal}@${domain}`;
  }

  return email.toLowerCase();
}

/**
 * メールアドレスのマスキング
 */
function maskEmail(email) {
  const [localPart, domain] = email.split("@");
  const maskedLocal =
    localPart.length > 2
      ? localPart.substring(0, 2) + "*".repeat(localPart.length - 2)
      : localPart;
  return `${maskedLocal}@${domain}`;
}

/**
 * 使い捨てメールドメインリスト更新
 */
async function updateDisposableEmailDomains() {
  // 外部APIから最新の使い捨てメールドメインリストを取得
  // （実装例として静的リストを使用）
  const updatedDomains = [
    "10minutemail.com",
    "guerrillamail.com",
    "tempmail.org",
    "yopmail.com",
    "mailinator.com",
    "throwaway.email",
    "temp-mail.org",
    "getnada.com",
    "sharklasers.com",
    "maildrop.cc",
    "guerrillamailblock.com",
    "tempr.email",
    "dispostable.com",
    "fakeinbox.com",
    "spamgourmet.com",
  ];

  const configRef = db
    .collection("system_config")
    .doc("disposable_email_domains");
  await configRef.set({
    domains: updatedDomains,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    source: "automated_update",
  });

  SecureLogger.info("Disposable email domains list updated", undefined, {
    domainCount: updatedDomains.length,
  });
}
