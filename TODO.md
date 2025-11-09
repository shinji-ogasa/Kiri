# Kiri 実装 TODO

仕様書 v0.1 を落とし込むための実装タスクリスト。各フェーズは順番に進めるが、依存関係がクリアになっている項目は並列化してもよい。

## Phase 0 — Foundation
- [x] 必要ライブラリ導入: `@supabase/supabase-js`, `expo-blur`, `expo-image-picker`, `expo-notifications`, `zustand`, `zod`, `react-native-webrtc` (EAS 用), `expo-file-system`, `expo-document-picker`, `uuid`。
- [x] `.env`, `app.config.ts` で Supabase/TURN/EAS Secrets を読み込む仕組みを追加。
- [x] `src/` 階層 (lib, features, components, store, hooks, types, utils) を作成し、パスエイリアス設定を `tsconfig.json` に追加。
- [x] デザイントークン (`src/constants/tokens.ts`) と `GlassCard`/`Surface` コンポーネントを実装し、グラスモーフィズムの土台を用意。
- [x] ベーステーマ (色/タイポ/スペーシング) と Global Provider (`AppProviders`) を作成し、テーマ/認証初期化を一元化。

## Phase 1 — 認証
- [x] Supabase クライアント (`src/lib/supabase.ts`) を定義し、AsyncStorage 連携を設定。
- [x] API ラッパー (`features/auth/api.ts`) とバリデータ (`validators.ts`) を整備。
- [x] `useAuthStore` (Zustand) でセッション管理・プロフィール同期を実装（Push Token は後続）。
- [x] `/ (auth)/signup` 画面: フォーム UI、バリデーション、アイコンアップロード、サインアップ処理、ID 表示モーダル(コピー可)を実装。
- [x] `/ (auth)/signin` 画面: メール/パスワードサインインとエラーハンドリングを実装。
- [x] サインアップ完了モーダル (コピー操作含む) を追加。

## Phase 2 — Connect
- [x] `/connect` 画面で 6 桁/8 桁判定とバリデーションを実装し、公開/永続化トグルを追加。
- [x] Supabase テーブル操作ベースでグループ join/create ＆ DM 作成/参加ロジックを実装し、部屋画面へ遷移。
- [x] 招待 ID / 非公開設定の詳細 UI を追加 (カンマ区切りで 8桁 ID を入力)。

## Phase 3 — Messages
- [x] `/messages` 画面で所属ルーム一覧を取得し、Connect への導線を追加。
- [x] `useRoomsStore` + Supabase Realtime 購読 (`rooms`, `room_members`, `messages`) を実装。
- [x] 未読バッジ計算、最終メッセージ/時刻表示、プルリフレッシュを実装。

## Phase 4 — チャット詳細
- [x] `/room/[id]`, `/dm/[id]` 画面: メッセージリストと Glassy Composer を実装。Realtime 購読で即時反映。
- [x] 添付 (画像/ファイル) アップロードと既読更新を追加。
- [x] グループ管理 UI (参加者一覧、招待、公開/永続化トグル) と権限チェック。
- [x] DM 画面に通話ボタン (音声/ビデオ) へのリンクを配置 (UI のみ)。

## Phase 5 — 通話 (WebRTC)
- [ ] `src/lib/webrtc.ts` で RTCPeerConnection ハンドラ、TURN 設定、シグナリング (Supabase Realtime + `call_signals`) を実装。
- [ ] `/call/[id]` 画面で音声/ビデオ UI、ミュート/カメラ切替、切断処理を提供。
- [ ] Edge Function `call_push_notify` の呼び出しと Push 通知ハンドラを実装。

## Phase 6 — 通知・背景処理
- [x] Expo Push Token の登録/更新、`expo-notifications` による Foreground/Background ハンドラを実装。
- [x] `profiles.expo_push_token` を更新し Edge Function に渡せる状態にする。
- [x] 24h 期限グループの UX (永続化トグル/管理カード) を実装済み。

## Phase 7 — テスト & QA
- [ ] ユニットテスト (バリデーション/ID生成/ストア) を Vitest/React Testing Library で追加。
- [ ] E2E (Maestro or Detox) で「2 ユーザー: signup → connect → messages → DM 通話」シナリオを自動化。
- [ ] Lint/format ワークフロー、EAS Build/Submit 設定、リリースノート雛形を整備。

進捗はこのファイルを更新しながら管理し、ブロッカーが発生した場合は即座に報告する。
