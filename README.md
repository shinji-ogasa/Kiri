# Kiri — React Native (Expo) Android メッセージアプリ仕様書 v0.1
最終更新: 2025-11-09 (JST)

Supabase を BaaS として採用し、Expo SDK 52+/React Native 0.75+ を前提に Android を主対象としたメッセージングアプリ「Kiri」の実装ガイドです。ファイルベースルーティング (expo-router) とカスタム Dev/Prod ビルドによる `react-native-webrtc` の組み込みを想定します。

⸻

## 0. 目的・範囲・前提
- **目的**: Expo/React Native で Android 向けメッセージングアプリを実装し、Supabase Auth/DB/Storage/Realtime/Edge Functions/Schedules を活用して DM・グループチャット・通話を提供する。
- **範囲**: メールサインアップ (ユーザーネーム/メール/パスワード/アイコン)、8桁アカウント ID、6桁コードのグループ作成/参加、DM、メッセージ一覧、DMのみ P2P 音声/ビデオ通話、24時間で消滅するグループ (管理者は永続化を指定可)。
- **前提**: Expo SDK 52+, React Native 0.75+, Android 8.0+, Supabase (Auth/DB/Storage/Realtime/Edge Functions/Schedules)、通話は `react-native-webrtc` を含むカスタムビルド。EAS Build/EAS Secrets を利用。

⸻

## 1. 用語
- **アカウントID (account_id8)**: 8桁の数値文字列 (例: `12345678`)。DM の宛先指定に利用。
- **部屋コード (code6)**: 6桁数値でグループを識別。初期作成者が管理者。
- **グループ**: code6 ベースで複数人会話。デフォルト 24h で消滅。管理者は永続化オプション有り。
- **DM**: account_id8 を指定した 1 対 1 会話。音声/ビデオ通話は DM のみ。

⸻

## 2. 主要ユーザーストーリー
1. 新規ユーザーがメールでサインアップすると、ユニークな 8 桁アカウント ID が自動付与される。
2. 「Connect」画面で 6 桁コードを入力すると、存在しない場合は新規グループ作成、存在する場合は参加。
3. グループ作成者は公開/非公開、招待ユーザー、永続化の可否を設定可能。
4. 「Message」画面ではグループ/DM のスレッド一覧を表示し、未読数/最終発言/時刻を確認できる。
5. 8 桁 ID を入力して DM を開始でき、DM 内で音声/ビデオ通話を開始できる。

⸻

## 3. 画面仕様 (概略)

### 3.1 Auth / 初回起動
- 入力: ユーザーネーム (小文字英数と下線 3–20 文字)、メール、パスワード、アイコン画像 (任意, 2MB 以下, JPEG/PNG/WebP)。
- フロー: サインアップ成功 → `profiles` に `account_id8`, `username`, `avatar_url` を生成 → アイコンは Storage `avatars` バケットにアップロードし署名 URL で参照。
- 表示: 生成された `account_id8` を表示しコピー可能にする。

### 3.2 Connect 画面
- 入力欄は 1 つ。`^\d{6}$` → グループ (存在すれば参加, なければ作成)、`^\d{8}$` → DM (存在しなければ作成)。
- 6 桁作成時は管理者設定モーダル (公開/非公開、招待 ID、永続化) を表示。
- バリデーション: 数値のみ、桁数厳密。形式エラーは即時表示。

### 3.3 Message 画面 (タブ: グループ / DM)
- スレッド一覧: アバター、名称、最終メッセージ、タイムスタンプ、未読バッジ。
- 検索/並び替え: 既読/未読、最終更新順。
- 既読管理: スクロール到達時にサーバーへ既読ポインタを更新。

### 3.4 チャット詳細画面
- 送受信: テキスト、画像/ファイル、タイピング表示、編集/削除 (ソフトデリート)。
- グループ: 参加者一覧、招待、公開/非公開切替、永続化切替 (管理者のみ)。
- DM: 音声/ビデオ通話ボタン (P2P)。

⸻

## 4. 機能要件
- Supabase Auth によるメール認証。
- 8 桁アカウント ID の自動生成 (重複なし)。
- 6 桁部屋コードの生成/解決、一意性確保。
- グループはデフォルト 24h で自動削除 (永続化指定時は除外)。
- DM は常時保持。
- Realtime でメッセージ/既読/メンバー更新を配信。
- DM のみ WebRTC 通話 (音声/ビデオ、Supabase Realtime をシグナリングに利用)。
- Expo Push + Edge Function で新規メッセージ/通話着信通知。タイピングインジケータは Supabase Realtime Broadcast で同期。

⸻

## 5. 非機能要件
- レイテンシ: メッセージ挿入から配信まで P50 < 300ms (同リージョン)。
- スケール: 同時接続 1 万を初期ターゲット (Realtime チャネル分割)。
- セキュリティ: Supabase RLS 必須、最小権限、行レベル制御、Storage 署名 URL。
- 可用性: 99.5%/月を初期目標、TURN 障害時のフォールバックを確保。

⸻

## 6. データモデル (ER 概要)

Auth
```
auth.users (Supabase 既定)
```

Public Schema
```
profiles         : ユーザープロファイル (8 桁 ID)
rooms            : 部屋 (グループ / DM)
room_members     : 部屋メンバーと役割
messages         : メッセージ本体
read_states      : 既読位置
call_signals     : 通話シグナリング (短期)
invites          : 招待管理 (非公開時)
```

Storage
```
avatars bucket   : プロフィール画像
attachments bucket: 画像/ファイル添付
```

### 6.1 テーブル定義 (DDL 概要)
```sql
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_id8 char(8) not null unique,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);
create or replace view profiles_public as
  select user_id, account_id8, username, display_name, avatar_url, created_at
  from profiles;

create type if not exists room_kind as enum ('group','dm');
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  kind room_kind not null,
  code6 char(6),
  creator uuid not null references auth.users(id),
  is_public boolean default true,
  is_persistent boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique (code6) where (code6 is not null)
);

create type if not exists member_role as enum ('admin','member');
create table if not exists room_members (
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz default now(),
  left_at timestamptz,
  primary key (room_id, user_id)
);

create type if not exists message_type as enum ('text','image','file','system');
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  sender uuid not null references auth.users(id),
  type message_type not null default 'text',
  text text,
  file_url text,
  meta jsonb,
  created_at timestamptz default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists read_states (
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  invited_account_id8 char(8) not null,
  invited_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  unique (room_id, invited_account_id8)
);

create table if not exists call_signals (
  id uuid primary key default gen_random_uuid(),
  dm_room_id uuid not null references rooms(id) on delete cascade,
  from_user uuid not null references auth.users(id),
  to_user uuid not null references auth.users(id),
  payload jsonb not null,
  created_at timestamptz default now()
);
```

### 6.2 生成ルール
- `account_id8`: `LPAD(FLOOR(random()*1e8)::text, 8, '0')` を重複するまでリトライ。
- `code6`: `LPAD(FLOOR(random()*1e6)::text, 6, '0')`。期限切れ部屋削除により事実上一意。
- `expires_at`: グループ作成時 `now() + interval '24 hours'`。`is_persistent=true` の場合は `null`。

⸻

## 7. RLS (行レベルセキュリティ) 方針
- `profiles`: 自分のみ read/write。公開情報は `profiles_public` ビュー経由。
- `rooms`: 公開グループは select 可。非公開/DM はメンバーのみ閲覧。管理者のみ更新。
- `room_members`: 当人と管理者のみ閲覧/追加/削除。
- `messages`: メンバーのみ select/insert。更新/削除は送信者か管理者。
- `read_states`/`invites`/`call_signals`: 関連ルームメンバーのみアクセス。

⸻

## 8. フロー仕様
1. **サインアップ**: メール/パスワード登録 → `profiles` に `account_id8` 生成挿入。
2. **部屋作成/参加 (6 桁)**: 未存在なら `rooms` 追加 + 作成者を admin として `room_members` に追加。既存は公開なら即参加、非公開は `invites` により制御。
3. **DM 作成 (8 桁)**: 相手 `profiles.account_id8` を検索、2 名のペアで一意な `rooms(kind='dm')` を作成 or 取得し 2 名を `room_members` に登録。
4. **メッセージ送受信**: `messages` に insert、Realtime で配信。既読は `read_states.last_read_at` を更新。
5. **グループ自動削除**: Edge Function + Scheduler (pg_cron) で 1 時間毎に `is_persistent=false AND expires_at < now()` を削除。
6. **通話 (DM)**: `call_signals` に SDP/ICE を短期保存して Realtime 通知。STUN/TURN 設定必須。着信通知は Edge Function → Expo Push。

⸻

## 9. 通知
- Expo Push Token を `profiles.expo_push_token` に保存し、アプリ側で `expo-notifications` を用いて権限取得/登録する。
- Foreground/Background 通知のハンドラを設定し、対象ルームの画面遷移などに利用できるようにする。
- 新規メッセージ・通話着信時に Edge Function が対象ユーザーのトークンへ通知。

⸻

## 10. ストレージ方針
- `avatars` バケット: プロフィール画像 (当人は書込可、閲覧は認証ユーザー全員)。
- `attachments` バケット: 画像/ファイル。ルームメンバーのみ読み取り可能な署名 URL (短期) を発行。

⸻

## 11. バリデーション / 制限
- 6 桁/8 桁コード: `^[0-9]{6}$` / `^[0-9]{8}$`。
- ユーザーネーム: `^[a-z0-9_]{3,20}$`、小文字のみ、ユニーク。
- メッセージ文字数上限例: 4000 文字。
- 添付サイズ上限例: 10MB、対応フォーマット: JPEG/PNG/WebP 等。
- アイコン画像: 2MB 以下。
- 連投レート制限: Edge Function で IP/ユーザー別制御。

⸻

## 12. エラーハンドリング例
| コード | 事象 | 表示/対処 |
| --- | --- | --- |
| `E-INVALID-CODE` | 6 桁/8 桁形式不正 | 入力を確認してください |
| `E-ROOM-NOT-FOUND` | 非公開部屋で未招待 | 管理者に招待を依頼してください |
| `E-DM-NOUSER` | 8 桁 ID 不存在 | アカウント ID を確認してください |
| `E-CALL-UNAVAILABLE` | 通話不可 (グループ/端末非対応) | DM でのみ利用可能です |

⸻

## 13. 開発・ビルド
- Expo Router: `/ (auth)/signin`, `/connect`, `/messages`, `/room/[id]`, `/dm/[id]`, `/call/[id]`。
- 主要ライブラリ: `@supabase/supabase-js`, `expo-router`, `expo-notifications`, `react-native-webrtc`, `zustand` or `redux`, `expo-blur`, `react-native-safe-area-context`。
- EAS Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, TURN 設定、`EXPO_PROJECT_ID`。
- Dev/Prod ビルドで `react-native-webrtc` を含める。Expo Go では動作しないため Development Build を利用。

⸻

## 14. テスト戦略
- **ユニット**: 入力バリデーション, ID 生成ロジック, store/hook の純粋関数。
- **結合**: Supabase RLS 下での CRUD、Realtime 配信、招待フロー、通知 Edge Function。
- **E2E**: 新規ユーザー 2 名でグループ/DM/通話の一連操作を自動化 (Detox/ Maestro 等)。

⸻

## 15. 将来拡張
- メッセージ検索、既読者一覧、ピン留め、引用、スタンプ。
- E2EE (端末鍵管理)。
- マルチデバイス同期、既読ポインタの端末別保持。

⸻

## 16. 参考 RPC / Edge Functions
- RPC: `create_or_join_group(code6, is_public, is_persistent, invited_account_ids[])`
- RPC: `create_or_open_dm(target_account_id8)`
- RPC: `post_message(room_id, text, file_url, meta)`
- RPC: `set_room_visibility(room_id, is_public)`
- RPC: `set_room_persistence(room_id, is_persistent)`
- Edge Function: `notify_message_insert` (DB webhook)
- Edge Function: `cleanup_expired_rooms` (scheduled)
- Edge Function: `call_push_notify` (incoming call)

⸻

## 17. セキュリティ備考
- 全テーブルで RLS を有効化し `auth.uid()` を利用。
- Storage はパブリック禁止。署名 URL は短命 (例: 5 分)。
- TURN 障害時のフォールバック経路とコスト見積もりを別管理。
- `SECURE UPDATE/DELETE` を徹底し、Edge Functions からのサービスキー利用時はロジック内で権限を最小化。

⸻

## 18. 理想ディレクトリ構造
```
root/
├─ app/                         # expo-router
│  ├─ (auth)/
│  │  ├─ signin.tsx
│  │  └─ signup.tsx             # username/email/password/icon picker
│  ├─ connect/index.tsx         # 単一入力欄 (6 桁=Group, 8 桁=DM)
│  ├─ messages/index.tsx
│  ├─ room/[id].tsx
│  ├─ dm/[id].tsx
│  └─ call/[id].tsx
├─ src/
│  ├─ lib/
│  │  ├─ supabase.ts            # クライアント初期化
│  │  ├─ realtime.ts            # チャネル購読/publish
│  │  ├─ notifications.ts       # Expo Push
│  │  └─ webrtc.ts              # RTCPeer/TURN 設定
│  ├─ features/
│  │  ├─ auth/                  # hooks, services
│  │  ├─ connect/
│  │  ├─ chat/                  # message list/input, read-state
│  │  ├─ dm/
│  │  └─ call/
│  ├─ components/
│  │  ├─ ui/                    # Button, TextInput, Avatar 等
│  │  └─ chat/                  # MessageBubble, Composer
│  ├─ store/                    # Zustand/Redux
│  │  ├─ useAuthStore.ts
│  │  ├─ useRoomsStore.ts
│  │  └─ useMessagesStore.ts
│  ├─ hooks/                    # usePagination, useRealtime 等
│  ├─ types/
│  └─ utils/
├─ assets/
│  ├─ icons/
│  └─ images/
├─ supabase/
│  ├─ migrations/
│  │  ├─ 001_schema.sql         # DDL
│  │  └─ 002_policies.sql       # RLS/Policies/View
│  ├─ functions/                # Edge Functions
│  │  ├─ notify_message_insert/
│  │  └─ cleanup_expired_rooms/
│  └─ config.toml
├─ .env                         # SUPABASE_URL, SUPABASE_ANON_KEY 等
├─ app.config.ts                # Expo config
├─ eas.json
├─ package.json
└─ tsconfig.json
```

⸻

## 19. デザイン仕様: カード UI × グラスモーフィズム

### 19.1 設計原則
- ルック&フィールは「カード UI × グラスモーフィズム」に固定。
- レイヤ構成: Surface → Card → 内容の 3 層。背景に直接コンポーネントを置かない。
- グリッド: 8pt ベース (カード間 12–16pt, インセット 16–20pt)。
- Surface レベル: Surface0=透明背景, Surface1=薄いカード, Surface2=強調カード (影+コントラスト)。
- アクセシビリティ: コントラスト比 ≥ 4.5:1、タップ領域 ≥ 44pt、Dynamic Type 対応。
- アニメーション: 120–200ms、標準イージング。視差は最小限。

### 19.2 デザイントークン
```ts
export const tokens = {
  radius: { sm: 16, md: 24, lg: 32 },
  blurPx: { card: 24 },
  glass: { bg: 'rgba(255,255,255,0.06)' },
  border: { inner: 'rgba(255,255,255,0.25)' },
  shadow: { outer: 'rgba(0,0,0,0.10)' },
  spacing: { grid: 8, gap: 12, gapLg: 16, inset: 16, insetLg: 20 },
  duration: { fast: 120, base: 180, slow: 200 },
};
```
- 角丸は 16/24/32 以外禁止。枠線は内側白 25% ヘアライン。影は黒 10%。
- ブラーは 20–30px、背景に透過白 6–10% を重ねる。

### 19.3 レイヤ定義
- Surface0: 透明背景 (低彩度)。
- Surface1 (Card): `tokens.blurPx.card` + `glass.bg` + `border.inner` + `shadow.outer`。通常情報用。
- Surface2 (Card+): Surface1 に影半径+1段、コントラスト+1段で強調。

### 19.4 React Native 実装最小セット
```bash
npx create-expo-app myapp && cd myapp
npx expo install expo-blur react-native-safe-area-context
```

`components/GlassCard.tsx`
```tsx
import { Platform, View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassCard({ children, style }: ViewProps & { children: React.ReactNode }) {
  const Container: any = Platform.OS === 'ios' ? BlurView : View;
  const extra = Platform.OS === 'ios' ? { intensity: 40, tint: 'default' } : {};
  return (
    <Container {...extra} style={[styles.card, style]}>
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: Platform.select({ android: 'rgba(255,255,255,0.06)', ios: 'transparent' }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
});
```
> 使い方例: `<GlassCard style={{ margin: 16 }}>{/* コンテンツ */}</GlassCard>`

### 19.5 コンポーネント設計ルール
- 名前は Surface/Card/Panel/HUD のみ使用。「Box」「Container」は禁止。
- 入力欄は必ず Card 上に配置。背景直置き不可。
- 1 カード 1 メッセージ。異なる目的を混ぜない。
- ブラーのネスト禁止。同時 3 枚まで。
- ダーク/ライト切替はトークンのみで対応。個別色追加禁止。

### 19.6 よくある地雷
- 透明度過多で可読性が落ちる → テキスト優先でコントラストを確保。
- Android のブラー非対応を無視しない → 半透明 + 影でフォールバック。
- 影と枠線を両方強くしない → どちらかを主役に。

⸻

## 20. 実装ロードマップ (推奨)

### Phase 0: 基盤整備 (1 週)
- Supabase プロジェクト作成、スキーマ/RLS/テストデータ投入。
- Edge Functions (notify/cleanup/call) の雛形とスケジューラ設定。
- Expo プロジェクト初期化、eslint/tsconfig/ディレクトリ準備、デザイントークン定義。

### Phase 1: 認証とコア UI (2 週)
- サインアップ/サインイン画面 (アイコンアップロード含む)。
- `profiles` 同期、`account_id8` 表示、`zustand` or `redux` ストア整備。
- Connect 画面入力ロジック (6 桁/8 桁判定, RPC 呼び出し)。UI は GlassCard ルール厳守。

### Phase 2: メッセージング機能 (3 週)
- Messages/Room/DM 画面 (一覧, 既読, 入力, 添付アップロード)。
- Supabase Realtime 購読, `read_states` 書き込み, 未読バッジ。
- Push 通知送信 Edge Function, Expo クライアントでの opt-in/トークン登録。

### Phase 3: 通話・クリーニング (2 週)
- `react-native-webrtc` 導入, TURN 設定, `call_signals` 経由のシグナリング。
- Edge Function `call_push_notify` と通話着信 UI。
- Cleanup ジョブ/永続化切替 UI/管理機能、バリデーション/レート制限仕上げ。

### Phase 4: QA & リリース準備 (1 週)
- 自動テスト/手動 QA、E2E (2 ユーザー) シナリオ。
- EAS ビルド (Dev/Preview/Prod) と配布、Firebase Crashlytics などのモニタリング導入。
- ドキュメント更新、リリースノート作成。

> 合計 7 週想定。並列化できる場合は Phase 2 と 3 の一部を並行実施。

⸻

## 21. 運用チェックリスト
- [ ] Supabase Keys/TURN 資格情報を EAS Secrets に登録した。
- [ ] Storage バケットの RLS と署名 URL ポリシーを確認した。
- [ ] Realtime チャネル分割 (DM/グループ) とバックオフ戦略を実装した。
- [ ] Expo Push のレート制限/退会端末管理を Edge Function で実装した。
- [ ] Cleanup Edge Function が 24h 経過グループを確実に削除することを検証した。

## 22. Supabase セットアップ手順
1. `supabase/migrations/001_schema.sql` を適用し、テーブル (profiles/rooms/room_members/messages/read_states/invites/call_signals) と補助関数 (`generate_account_id8` など) を作成する。`pgcrypto` 拡張を有効化すること。
2. `supabase/migrations/002_policies.sql` を適用し、RLS ポリシーを有効化する。profiles/rooms/messages などは既に `auth.uid()` ベースで保護済み。Storage バケット `avatars` / `attachments` を作成し、該当ユーザー/ルームメンバーにのみアクセスを許可する。
3. `supabase/migrations/003_rpcs.sql` を適用し、アプリから利用する RPC (`create_or_join_group`, `create_or_open_dm`, `post_message`, `set_room_visibility`, `set_room_persistence`) をデプロイする。
4. Storage:
   - `avatars` バケット: public read (authenticated) + owner write。`uploadAvatar` が利用。
   - `attachments` バケット: private (署名 URL 経由)。`sendAttachmentMessage` が利用。
5. Realtime: `messages` / `room_members` テーブルをサブスクライブするため、Supabase プロジェクトの Realtime 設定で該当テーブルを有効化する。
6. スケジューラ: `rooms` の `is_persistent = false` かつ `expires_at < now()` な行を削除する Edge Function / Cron ジョブを追加し、24h 消滅ルールを実現する。

---

付録 A: 最短実装シーケンス (参考)
1. Supabase: スキーマ/ポリシー/RPC/Edge Functions/スケジュール設定。
2. Expo: Auth → Connect → Messages → Room/DM の順で UI/ロジックを実装し Realtime を組み込む。
3. DM 通話: WebRTC (Signaling = Realtime/DB)、EAS ビルド、Push 連携を統合。
