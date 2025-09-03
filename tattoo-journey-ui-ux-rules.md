# Tattoo Journey – UI/UX 要件定義ルール

## 0. 基本方針

- **UI (User Interface)** と **UX (User Experience)** を明確に分ける。
- UI は **画面の構造・コンポーネント・ビジュアル設計** に限定する。
- UX は **状態遷移・行動フロー・受け入れ基準・体験全体の滑らかさ** を定義する。
- このルールを守ることで、UIとUXを別プロンプトでCursorに投げられるようにする。

---

## 1. UI 要件定義ルール

UI は「**目に見える部分**」に責任を持つ。
以下の観点を必ず満たすこと：

### 1.1 画面一覧

- `/login`：認証ボタン（Google/Appleダミー）
- `/onboarding`：タグ選択3〜5個
- `/` (Home)：画像グリッド＋下部ナビ
- `/search`：「＋」起点の検索UI（画像アップロード・テキスト入力・結果表示）
- `/design/[id]`：デザイン詳細（価格帯・サイズ例・関連作家）
- `/artist/[id]`：作家詳細（プロフィール・レビュー・カレンダー）
- `/chat/[threadId]`：チャットUI（送信/画像添付/定型質問）
- `/booking/[id]`：予約ステップ（仮押さえ→承認待ち→確定）
- `/review/[bookingId]`：レビュー投稿（星＋テキスト＋写真）

### 1.2 コンポーネント設計

- `/CLAUDE.rule` を最優先に採用
- `/components/ui/*`：Button, Badge, BottomNav, ImageCard, Tag
- `/features/*`：Feed, Search, Chat, Booking, Review 単位で整理
- `/mocks/fixtures.ts`：ダミーデータをここに集中管理

### 1.3 UI 受け入れ基準

- **表示速度**：初回ロード3秒以内、操作応答200ms以内を目標
- **レスポンシブ**：スマホFirst、PCでも崩れない
- **0件時UI**：必ず緩和提案（距離+2km/平日/価格幅拡大）を画面上に表示
- **ナビゲーション**：下部ナビゲーションが全画面で一貫して表示されること

---

## 2. UX 要件定義ルール

UXは「**行動の一貫性と状態管理**」に責任を持つ。
以下の観点を必ず満たすこと：

### 2.1 状態遷移（State Machine）

- **予約 (booking)**
  - idle → requested → pending → confirmed
- **レビュー (review)**
  - locked → unlocked（来店後）→ submitted

### 2.2 行動フロー（代表ユーザー）

- ユイ（初タトゥー）：画像→似デザイン→作家→チャット→予約→レビュー
- カイ（効率重視）：条件検索→指名→予約→日程変更→レビュー
- ミホ（熟考型）：保存→比較→見積→デポジット→レビュー

### 2.3 UX 受け入れ基準

- **認証**：SNSボタン押下→3秒以内にホーム遷移
- **予約一貫性**：bookingIdは単一、履歴に状態を追加していく方式
- **競合処理**：同時予約申請は早押し優先、もう一方には代替枠を必ず提示
- **通知**：主要イベント（申請/承認/変更/レビュー依頼）はアプリ内＋メール両方
- **レビュー解放**：来店フラグがtrueのときのみ有効化

### 2.4 計測イベント（最低限）

- `auth_login`, `onboarding_complete`
- `feed_view`, `image_search_done`
- `design_view`, `artist_view`
- `booking_request`, `booking_confirmed`
- `deposit_succeeded/failed`
- `review_prompted`, `review_submitted`

---

## 3. 運用ルール

- **UIタスクとUXタスクは別プロンプトで実装**すること。
- UIプロンプト → **画面骨格とスタイル**を生成。
- UXプロンプト → **状態管理・行動フロー・受け入れ基準のロジック**を実装。
- 両者は同じ`/mocks/fixtures.ts`を参照し、**分離しても一貫して動作**すること。

---

🎯 このファイルを `tattoo-journey-ui-ux-rules.md` としてプロジェクトに置けば、
Cursorに「UI側実装」「UX側実装」と投げ分けるときのルールブックになる。

---
