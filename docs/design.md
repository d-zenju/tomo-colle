# 設計書 / 引き継ぎドキュメント

## 概要

トモダチコレクション風の自己紹介Webアプリ。  
シンプルさを優先し、フレームワーク・DBなしで完結する構成にしている。

---

## アーキテクチャ

```
ブラウザ (public/index.html)
    │  fetch API (JSON)
    ▼
src/index.ts（起動）
    │  serve()
    ▼
src/app.ts（Honoアプリ）─── 静的ファイル配信 (/*)
    │  /api/friends/*
    │  /api/personality
    ▼
friends.ts (CRUD)      personality.ts (診断ロジック)
    │
    ▼
data/friends.json (ファイルストレージ)
```

すべてのリクエストは同一オリジン（localhost:3000）。フロントエンドはAPIベースURLをハードコードせず、相対パスで呼び出している（`fetch('/api/friends')`）。

---

## コンポーネント詳細

### `src/app.ts` — Honoアプリ定義

- Honoアプリを生成してルーティングとミドルウェアを定義し、`app` をエクスポートする
- CORSミドルウェアをすべてのルートに適用（ブラウザからのpreflightを許可）
- APIルートをすべて定義したあと、末尾に `serveStatic({ root: './public' })` を置くことで、`/api/*` 以外のリクエストは `public/` のファイルに fallback する
- バリデーションはルートハンドラ内でシンプルに実装（必須チェック・血液型enum・数値範囲）
- `index.ts` から分離されているため、テストが `serve()` を起動せずに `app` 単体を検証できる

### `src/index.ts` — サーバー起動エントリー

- `app.ts` からアプリをインポートして `serve()` を呼ぶだけ
- テスト時はこのファイルを使わず `app.ts` を直接インポートする

### `src/friends.ts` — データ層

- `data/friends.json` への読み書きで永続化
- 起動時に `data/` ディレクトリとファイルを自動作成（`initStorage`）
- IDは `crypto.randomUUID()` で生成
- 読み書きはすべて非同期（`fs/promises`）

### `src/personality.ts` — 診断ロジック

4つのパラメータ（各1〜5）から12タイプのいずれかを判定する。

**判定軸:**
| パラメータ | 低(1〜2) | 高(3〜5) |
|-----------|----------|----------|
| `pace` | のんびり | てきぱき |
| `sociability` | ソロ好き | ワイワイ好き |
| `focus` | 直感・感覚 | 論理・思考 |
| `attitude` | おおまか・自由 | 几帳面・きっちり |

**グループ判定（pace × sociability）:**

```
pace < 3  && sociability < 3  → まったり系
pace >= 3 && sociability >= 3 → エネルギッシュ系
pace >= 3 && sociability < 3  → インテリ系
pace < 3  && sociability >= 3 → フリーダム系
```

**タイプ判定（各グループ内でfocus × attitudeで3分岐）:**

| グループ | focus<3 / attitude<3 | focus>=3 / attitude<3 | その他 |
|----------|---------------------|----------------------|--------|
| まったり系 | ひだまりの居眠り職人 | ほのぼの系聞き上手 | 心優しきグリーンフィンガー |
| エネルギッシュ系 | 直感型スピードスター | お祭り騒ぎの仕掛け人 | 涙もろきパッションリーダー |
| インテリ系 | スマートな解決屋 | ポーカーフェイスの戦略家 | 歩く知識の図書館 |
| フリーダム系 | 神出鬼没のアイデアマン | マイペースな芸術家 | のほほん宇宙人 |

### `src/types.ts` — 型定義

`Friend`（DBレコード）と `FriendInput`（POST/PUT本体）を分離している。  
`FriendInput = Omit<Friend, 'id' | 'created_at' | 'updated_at'>` とすることで、クライアントが送ってはいけないフィールドを型レベルで除外している。

### `public/index.html` — フロントエンド

- 依存ライブラリなしのバニラHTML（バンドラ・npm不要）
- `<style>` と `<script>` をHTMLに直書き（1ファイルで完結）
- 状態は `let friends = []` / `let currentFriend = null` といったモジュールスコープ変数で管理
- 性格診断結果は `lastDiagnosis` 変数に保持し、「つかう」ボタンでフォームへ転写

---

## データモデル

```typescript
interface Friend {
  id: string;           // UUID
  name: string;         // 本名
  nickname: string;     // ニックネーム
  birthdate: string;    // "YYYY-MM-DD"
  blood_type: 'A' | 'B' | 'AB' | 'O';
  tagline: string;      // 一言自己紹介
  favorite_food?: string;
  favorite_thing?: string;
  hobby?: string;
  personality_type?: string;  // 診断タイプ名（自由入力も可）
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}
```

`personality_type` はAPIが返すタイプ名の文字列と同一だが、フリーテキストとして保存しているため、診断結果以外の文字列も受け付ける。

---

## APIスキーマ

詳細は [`openapi.yaml`](openapi.yaml) を参照。  
Swagger UIで見る場合は [editor.swagger.io](https://editor.swagger.io) にyamlを貼り付けると確認できる。

---

## 拡張ポイント

### 性格タイプを追加・変更したい

`src/personality.ts` の `PERSONALITY_TYPES` オブジェクトにタイプを追加し、`diagnose()` 関数の分岐を変更する。フロントエンドの `PERSONALITY_GROUPS` 定数にも同じタイプ名のエントリを追加すること（バッジの色が適用される）。

### Friendにフィールドを追加したい

1. `src/types.ts` の `Friend` インターフェースにフィールドを追加
2. `src/app.ts` のバリデーション箇所を更新（必須なら存在チェックを追加）
3. `public/index.html` のフォーム・詳細モーダルにUIを追加

### JSONからDBに移行したい

`src/friends.ts` の `readFriends()` と `writeFriends()` を差し替えるだけでよい。ルートハンドラや型定義への変更は不要。

### フロントエンドをフレームワーク化したい

`public/index.html` はAPIクライアントとして `/api/*` を叩いているだけなので、React/Vue等で作り直したものを `public/` 以下に置けばそのまま動く。Honoの `serveStatic` が `public/` 配下を静的配信する。

---

## テスト

`src/__tests__/` に3ファイルを配置。フレームワークは [Vitest](https://vitest.dev/)。

| ファイル | 対象 | モック |
|---------|------|--------|
| `personality.test.ts` | `diagnose()` / `PERSONALITY_TYPES` | なし（純粋関数） |
| `friends.test.ts` | CRUD関数全件 | `fs/promises` |
| `api.test.ts` | 全HTTPエンドポイント | `../friends`, `@hono/node-server/serve-static` |

**モック戦略の方針:**

- `personality.ts` は副作用のない純粋関数なのでモック不要。全12タイプと境界値を網羅的に検証する。
- `friends.ts` は `fs/promises` をモックして実ファイルに触れずにCRUDの振る舞いを検証する。
- `api.test.ts` は `app.ts` から `app` を直接インポートし、`app.request()` でHTTPレイヤーをテストする。`friends` モジュールはモックして、ルーティング・バリデーション・レスポンス形成の検証に集中する。

**テスト中に発覚したバグ:**

`c.text('', 204)` は Fetch 仕様上 body を持てない 204 No Content をボディあり（空文字）で返していた。テスト環境の undici が厳格にこれを拒否したことで発覚し、`c.newResponse(null, 204)` に修正済み。

---

## 既知の制約

- **同時書き込み**: `friends.json` への読み書きはアトミックでないため、同時リクエストが重なるとデータが競合する可能性がある。単一ユーザーの用途を想定した実装。
- **スケール**: JSONファイルストレージのため、件数が増えると読み書きのコストが線形に増加する。
- **認証なし**: 誰でもCRUD操作が可能。公開環境に置く場合は認証を追加すること。
