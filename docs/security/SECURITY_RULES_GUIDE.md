# Firebase Security Rules Guide - Tattoo Journey 2.0

このドキュメントはTattoo Journey 2.0アプリのFirebaseセキュリティルールの詳細な説明を提供します。

## 概要

Firebase Security RulesはTattoo Journey 2.0アプリのデータセキュリティを確保するために以下の原則に基づいて設計されています：

1. **最小権限の原則**: ユーザーは必要最小限のデータにのみアクセス可能
2. **ロールベースアクセス制御**: Customer と Artist の役割に基づいた権限管理
3. **データ整合性**: 書き込み時のデータ検証とビジネスルールの適用
4. **プライバシー保護**: 個人情報と機密データの適切な保護

## Firestore Security Rules

### 1. ユーザー管理 (`/users/{userId}`)

**アクセス権限:**

- 読み取り: 自分のプロフィール + アーティストの公開プロフィール
- 書き込み: 自分のプロフィールのみ
- 削除: 禁止（ソフト削除を使用）

**データ検証:**

- 必須フィールド: `uid`, `email`, `userType`, `createdAt`, `updatedAt`
- メールアドレス形式の検証
- アーティストの場合は追加の`artistInfo`検証

### 2. ポートフォリオ管理 (`/portfolioItems/{itemId}`)

**アクセス権限:**

- 読み取り: 全認証済みユーザー（公開表示）
- 書き込み: アーティスト所有者のみ
- 削除: アーティスト所有者のみ

**データ検証:**

- 必須フィールド: `artistId`, `imageUrl`, `createdAt`, `updatedAt`
- タグとAI解析データの形式検証

### 3. 予約管理 (`/bookingRequests/{bookingId}`)

**アクセス権限:**

- 読み取り: 予約の参加者（顧客とアーティスト）のみ
- 作成: 顧客のみ
- 更新: 参加者のみ（ステータス遷移ルール適用）
- 削除: 禁止

**ステータス遷移ルール:**

```
pending → [accepted, declined, negotiating, cancelled]
accepted → [confirmed, cancelled]
declined → []
negotiating → [accepted, declined, cancelled]
confirmed → [completed, cancelled]
completed → []
cancelled → []
```

### 4. レビューシステム (`/reviews/{reviewId}`)

**アクセス権限:**

- 読み取り: 全認証済みユーザー（透明性確保）
- 作成: 完了した予約の顧客のみ
- 更新: 作成者のみ（作成後30日以内）
- 削除: 禁止（透明性確保）

**データ検証:**

- 評価値: 1-5の整数
- 完了した予約に対してのみレビュー可能

### 5. チャット機能 (`/chatRooms/{roomId}`)

**アクセス権限:**

- 読み取り: 参加者のみ
- 作成: 参加者のみ
- 更新: 参加者のみ（最終メッセージ情報など）
- 削除: 禁止（履歴保存）

## Realtime Database Security Rules

### 1. メッセージング (`/messages/{roomId}`)

**アクセス権限:**

- 読み取り: チャットルーム参加者のみ
- 書き込み: チャットルーム参加者のみ

**メッセージ検証:**

- 送信者IDは認証済みユーザーIDと一致必須
- メッセージ長: 1-10,000文字
- タイムスタンプ: 現在時刻以前、24時間以内

### 2. リアルタイム機能

**タイピング状態 (`/typing/{roomId}`):**

- 10秒後の自動削除
- 参加者のみアクセス可能

**ユーザー在線状態 (`/presence/{userId}`):**

- 全ユーザー読み取り可能
- 自分の状態のみ更新可能

**既読確認 (`/readReceipts/{roomId}`):**

- 参加者のみアクセス可能
- 自分の既読状態のみ更新可能

## セキュリティベストプラクティス

### 1. データ検証

```javascript
// 例: ユーザーデータ検証
function validateUserData(data) {
  return data.keys().hasAll(['uid', 'email', 'userType']) &&
         data.uid is string &&
         isValidEmail(data.email) &&
         isValidUserType(data.userType);
}
```

### 2. 権限チェック

```javascript
// 例: 所有者チェック
function isOwner(userId) {
  return request.auth.uid == userId;
}

// 例: ロールチェック
function isArtist() {
  return isAuthenticated() &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'artist';
}
```

### 3. ビジネスルール適用

```javascript
// 例: 予約ステータス遷移検証
function validateBookingStatusUpdate(oldData, newData) {
  let validTransitions = {
    pending: ["accepted", "declined", "negotiating", "cancelled"],
    // ... その他の遷移
  };
  return newData.status in validTransitions[oldData.status];
}
```

## デプロイとテスト

### 1. ルールのデプロイ

```bash
# Firestoreルールのデプロイ
firebase deploy --only firestore:rules

# Realtime Databaseルールのデプロイ
firebase deploy --only database

# 全てのルールをデプロイ
firebase deploy
```

### 2. エミュレーターでのテスト

```bash
# エミュレーター起動
firebase emulators:start

# テストの実行
npm test
```

### 3. セキュリティルールテスト

```javascript
// テスト例
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";

test("allow users to read their own profile", async () => {
  const db = getFirestore(myAuth);
  await assertSucceeds(get(doc(db, "users", myAuth.uid)));
});

test("deny users from reading other user profiles", async () => {
  const db = getFirestore(myAuth);
  await assertFails(get(doc(db, "users", "other-user-id")));
});
```

## 監視とログ

### 1. セキュリティ監視

- Firebase Console でセキュリティルール違反の監視
- Cloud Functions でのアクセスログ記録
- 異常なアクセスパターンのアラート設定

### 2. パフォーマンス最適化

- ルール評価のコスト監視
- 複雑なクエリの最適化
- インデックス使用の確認

## 重要な注意点

1. **機密情報の保護**: APIキーや認証トークンはクライアントサイドに保存禁止
2. **定期的な監査**: セキュリティルールの定期的な見直しと更新
3. **最新化の維持**: Firebaseのセキュリティ更新に合わせたルール調整
4. **テスト重要性**: 新機能追加時は必ずセキュリティルールテストを実施

## トラブルシューティング

### よくある問題と解決方法

1. **Permission Denied エラー**
   - ユーザー認証状態の確認
   - ルール条件の詳細確認
   - Firebase Console でのアクセスログ確認

2. **データ検証エラー**
   - 必須フィールドの存在確認
   - データ型の一致確認
   - ビジネスルール条件の確認

3. **パフォーマンス問題**
   - ルール評価の複雑度確認
   - 不要なデータ読み取りの削減
   - インデックス最適化

このセキュリティルールガイドは、Tattoo Journey 2.0アプリの安全性とデータ整合性を確保するための包括的な指針を提供しています。
