/**
 * Security Monitoring Cloud Functions - SEC-003
 * アクセスログ監視とセキュリティイベント検知
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { SecureLogger } = require("./utils/secure-logger");

// Firebase Admin初期化
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ✅ セキュリティイベント監視: 不正アクセス試行の検知
 */
exports.onSecurityViolation = functions.auth.user().onCreate(async (user) => {
  try {
    await logSecurityEvent({
      eventType: "user_created",
      userId: user.uid,
      email: user.email,
      timestamp: new Date(),
      metadata: {
        emailVerified: user.emailVerified,
        creationTime: user.metadata.creationTime,
      },
    });
  } catch (error) {
    SecureLogger.error("Security event logging failed", undefined, {
      error,
      reportToService: true,
      level: "critical",
    });
  }
});

/**
 * ✅ Firestore書き込み監視: 異常なデータ操作を検知
 */
exports.onFirestoreWrite = functions.firestore
  .document("{collection}/{documentId}")
  .onWrite(async (change, context) => {
    const { collection, documentId } = context.params;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    try {
      // セキュリティ関連コレクションの監視
      const securityCollections = [
        "users",
        "portfolioItems",
        "inquiries",
        "bookingRequests",
        "reviews",
        "chatRooms",
      ];

      if (securityCollections.includes(collection)) {
        await analyzeDataAccess(collection, documentId, before, after, context);
      }

      // 大量データ操作の検知
      if (isHighVolumeOperation(before, after)) {
        await logSecurityEvent({
          eventType: "high_volume_operation",
          collection,
          documentId,
          userId: context.auth?.uid || "anonymous",
          timestamp: new Date(),
          severity: "medium",
        });
      }
    } catch (error) {
      SecureLogger.error("Firestore write monitoring failed", undefined, {
        error,
        reportToService: true,
        collection,
        documentId,
      });
    }
  });

/**
 * ✅ Storage操作監視: ファイルアクセスパターンを監視
 */
exports.onStorageChange = functions.storage
  .object()
  .onFinalize(async (object) => {
    try {
      const { name, bucket, contentType, size } = object;

      // セキュリティ関連パスの監視
      const securityPaths = ["artists/", "users/", "chat/"];
      const isSecurityRelated = securityPaths.some((path) =>
        name.startsWith(path),
      );

      if (isSecurityRelated) {
        await logSecurityEvent({
          eventType: "file_upload",
          fileName: name,
          bucket,
          contentType,
          size: parseInt(size),
          timestamp: new Date(),
          metadata: {
            uploadSource: "client",
            securityPath: true,
          },
        });
      }

      // 異常なファイルサイズの検知
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (parseInt(size) > maxSize) {
        await logSecurityEvent({
          eventType: "oversized_file_upload",
          fileName: name,
          size: parseInt(size),
          maxAllowed: maxSize,
          timestamp: new Date(),
          severity: "high",
        });
      }
    } catch (error) {
      SecureLogger.error("Storage monitoring failed", undefined, {
        error,
        reportToService: true,
        fileName: object.name,
      });
    }
  });

/**
 * ✅ リアルタイム異常検知システム
 */
exports.detectAnomalousPatterns = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // 過去5分間のセキュリティイベントを分析
      const recentEvents = await db
        .collection("security_events")
        .where("timestamp", ">=", fiveMinutesAgo)
        .orderBy("timestamp", "desc")
        .limit(1000)
        .get();

      if (!recentEvents.empty) {
        const events = recentEvents.docs.map((doc) => doc.data());
        await analyzeSecurityPatterns(events);
      }
    } catch (error) {
      SecureLogger.error("Anomaly detection failed", undefined, {
        error,
        reportToService: true,
        level: "critical",
      });
    }
  });

/**
 * データアクセス分析
 */
async function analyzeDataAccess(
  collection,
  documentId,
  before,
  after,
  context,
) {
  const userId = context.auth?.uid;
  const eventType = !before ? "create" : !after ? "delete" : "update";

  // ポートフォリオアクセスの監視
  if (collection === "portfolioItems" && eventType === "read") {
    const isOwnerAccess = after?.artistId === userId;
    const hasPermission = await checkPortfolioViewPermission(
      userId,
      after?.artistId,
    );

    if (!isOwnerAccess && !hasPermission) {
      await logSecurityEvent({
        eventType: "unauthorized_portfolio_access",
        userId,
        targetArtistId: after?.artistId,
        documentId,
        timestamp: new Date(),
        severity: "high",
      });
    }
  }

  // レビュー操作の監視
  if (collection === "reviews") {
    await logSecurityEvent({
      eventType: `review_${eventType}`,
      userId,
      documentId,
      reviewerId: after?.customerId || before?.customerId,
      artistId: after?.artistId || before?.artistId,
      timestamp: new Date(),
    });
  }
}

/**
 * ポートフォリオ閲覧権限チェック
 */
async function checkPortfolioViewPermission(userId, artistId) {
  if (!userId || !artistId) return false;

  try {
    // マッチング履歴チェック
    const matchingDoc = await db
      .collection("matchingHistory")
      .doc(`${userId}_${artistId}`)
      .get();

    if (matchingDoc.exists) return true;

    // アクティブな問い合わせチェック
    const inquiryDoc = await db
      .collection("inquiries")
      .doc(`${userId}_${artistId}`)
      .get();

    if (inquiryDoc.exists) {
      const inquiry = inquiryDoc.data();
      return ["pending", "responded"].includes(inquiry.status);
    }

    // 完了予約チェック
    const bookingDoc = await db
      .collection("confirmedBookings")
      .doc(`${userId}_${artistId}`)
      .get();

    if (bookingDoc.exists) {
      const booking = bookingDoc.data();
      return booking.status === "completed";
    }

    return false;
  } catch (error) {
    SecureLogger.error("Permission check failed", undefined, { error });
    return false;
  }
}

/**
 * 大量操作検知
 */
function isHighVolumeOperation(before, after) {
  // 配列操作で大量の要素が追加された場合
  if (after && typeof after === "object") {
    for (const [key, value] of Object.entries(after)) {
      if (Array.isArray(value) && value.length > 100) {
        return true;
      }
    }
  }
  return false;
}

/**
 * セキュリティパターン分析
 */
async function analyzeSecurityPatterns(events) {
  const patterns = {
    highFrequencyAccess: new Map(),
    suspiciousUserActivity: new Map(),
    unauthorizedAttempts: [],
  };

  // イベントパターン分析
  for (const event of events) {
    // 高频度アクセス検知
    if (event.userId) {
      const current = patterns.highFrequencyAccess.get(event.userId) || 0;
      patterns.highFrequencyAccess.set(event.userId, current + 1);
    }

    // 不正アクセス試行検知
    if (event.eventType.includes("unauthorized") || event.severity === "high") {
      patterns.unauthorizedAttempts.push(event);
    }
  }

  // アラート判定
  for (const [userId, count] of patterns.highFrequencyAccess) {
    if (count > 50) {
      // 5分間に50回以上のアクセス
      await triggerSecurityAlert({
        alertType: "high_frequency_access",
        userId,
        eventCount: count,
        timeWindow: "5_minutes",
        severity: "high",
      });
    }
  }

  // 不正アクセス試行が多い場合
  if (patterns.unauthorizedAttempts.length > 10) {
    await triggerSecurityAlert({
      alertType: "multiple_unauthorized_attempts",
      attemptCount: patterns.unauthorizedAttempts.length,
      timeWindow: "5_minutes",
      severity: "critical",
    });
  }
}

/**
 * セキュリティイベントログ記録
 */
async function logSecurityEvent(eventData) {
  try {
    await db.collection("security_events").add({
      ...eventData,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      environment: process.env.FUNCTIONS_EMULATOR
        ? "development"
        : "production",
    });

    // 高severity イベントは即座に外部サービスに報告
    if (eventData.severity === "critical" || eventData.severity === "high") {
      SecureLogger.error(`Security event: ${eventData.eventType}`, undefined, {
        reportToService: true,
        level: "critical",
        securityEvent: eventData,
      });
    }
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

/**
 * セキュリティアラート送信
 */
async function triggerSecurityAlert(alertData) {
  try {
    await db.collection("security_alerts").add({
      ...alertData,
      timestamp: new Date(),
      status: "active",
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 外部アラートサービスに送信
    SecureLogger.error(`Security Alert: ${alertData.alertType}`, undefined, {
      reportToService: true,
      level: "critical",
      alert: alertData,
    });
  } catch (error) {
    console.error("Failed to trigger security alert:", error);
  }
}
