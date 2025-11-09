# Kiri 実装 TODO

仕様書 v0.1 を落とし込むための実装タスクリスト。各フェーズは順番に進めるが、依存関係がクリアになっている項目は並列化してもよい。

## Phase 0 — Foundation
- [ ] 必要ライブラリ導入: `@supabase/supabase-js`, `expo-blur`, `expo-image-picker`, `expo-notifications`, `zustand`, `zod`, `react-native-webrtc` (EAS 用), `expo-file-system`, `expo-document-picker`, `uuid`。
- [ ] `.env`, `app.config.ts` で Supabase/TURN/EAS Secrets を読み込む仕組みを追加。
- [ ] `src/` 階層 (lib, features, components, store, hooks, types, utils) を作成し、パスエイリアス設定を `tsconfig.json` に追加。
- [ ] デザイントークン (`src/constants/tokens.ts`) と `GlassCard`/`Surface` コンポーネントを実装し、グラスモーフィズムの土台を用意。
- [ ] ベーステーマ (色/タイポ/スペーシング) と Global Provider (`AppProviders`) を作成。

## Phase 1 — 認証
- [ ] Supabase クライアント (`src/lib/supabase.ts`) と API ラッパー (`auth`, `profiles`) を定義。
- [ ] `useAuthStore` (Zustand) でセッション管理、プロフィール同期、Push Token 保存を実装。
- [ ] `/ (auth)/signup` 画面: フォーム UI、バリデーション (zod)、アイコンアップロード (avatars bucket)、サインアップ処理。
- [ ] `/ (auth)/signin` 画面: メール/パスワードサインイン、エラー表示、リセット導線 (後回し可)。
- [ ] サインアップ完了モーダルで生成された `account_id8` を表示/コピーできる UI を追加。

## Phase 2 — Connect
- [ ] `/connect` 画面を単一入力欄 + GlassCard UI で構築し、6 桁/8 桁の判定ロジックとエラーメッセージを実装。
- [ ] RPC (`create_or_join_group`, `create_or_open_dm`) のクライアント側呼び出しを作成し、結果に応じて `/room/[id]` or `/dm/[id]` へ遷移。
- [ ] 管理者設定モーダル (公開/非公開/招待/永続化) の UI とステートを実装。

## Phase 3 — Messages
- [ ] `/messages` 画面をタブ (グループ/DM) + スレッドカード一覧で構築し、検索/フィルタ UI を提供。
- [ ] `useRoomsStore` + Supabase Realtime 購読 (`rooms`, `room_members`, `messages`) を実装。
- [ ] 未読バッジ計算、最終メッセージ/時刻表示、プルリフレッシュを実装。

## Phase 4 — チャット詳細
- [ ] `/room/[id]`, `/dm/[id]` 画面: メッセージリスト、Glassy Composer、添付 (画像/ファイル) アップロード。
- [ ] `messages`, `read_states` の CRUD Hook (`useMessages`) を作成し、スクロール到達で既読更新。
- [ ] グループ管理 UI (参加者一覧、招待、公開/永続化トグル) と権限チェック。
- [ ] DM 画面に通話ボタン (音声/ビデオ) を配置。

## Phase 5 — 通話 (WebRTC)
- [ ] `src/lib/webrtc.ts` で RTCPeerConnection ハンドラ、TURN 設定、シグナリング (Supabase Realtime + `call_signals`) を実装。
- [ ] `/call/[id]` 画面で音声/ビデオ UI、ミュート/カメラ切替、切断処理を提供。
- [ ] Edge Function `call_push_notify` の呼び出しと Push 通知ハンドラを実装。

## Phase 6 — 通知・背景処理
- [ ] Expo Push Token の登録/更新、バックグラウンド通知 (メッセージ/通話) のリスニング。
- [ ] `notify_message_insert`, `cleanup_expired_rooms` Edge Function と連携するフロント側トリガー/状態更新。
- [ ] 24h 期限グループの UX (タイマー表示、永続化トグル) を実装。

## Phase 7 — テスト & QA
- [ ] ユニットテスト (バリデーション/ID生成/ストア) を Vitest/React Testing Library で追加。
- [ ] E2E (Maestro or Detox) で「2 ユーザー: signup → connect → messages → DM 通話」シナリオを自動化。
- [ ] Lint/format ワークフロー、EAS Build/Submit 設定、リリースノート雛形を整備。

進捗はこのファイルを更新しながら管理し、ブロッカーが発生した場合は即座に報告する。
