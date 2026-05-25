# 🏘️ トモダチコレクション 自己紹介帳

トモダチコレクション風のUIで自己紹介を登録・表示できるWebアプリです。  
Hono製REST APIと、バニラHTMLのSPAフロントエンドで構成されています。

---

## 機能

| 機能 | 説明 |
|------|------|
| トモダチ一覧 | 登録済みの自己紹介をカードグリッドで表示 |
| 詳細表示 | カードをクリックしてフルプロフィールをモーダル表示 |
| 新規登録 | 名前・生年月日・血液型・一言など必要事項を入力して登録 |
| 性格診断連携 | 4軸スライダーで診断 → 結果をそのままプロフィールに反映 |
| 編集・削除 | 詳細モーダルから既存データを更新・削除 |

---

## セットアップ

```bash
npm install
npm run dev
```

起動後、ブラウザで http://localhost:3000 を開いてください。

---

## ディレクトリ構成

```
tomo-colle/
├── src/
│   ├── app.ts            # Honoアプリ定義（ルーティング・ミドルウェア）
│   ├── index.ts          # サーバー起動エントリー（serve()のみ）
│   ├── friends.ts        # 自己紹介CRUD（JSONファイルI/O）
│   ├── personality.ts    # 性格診断ロジック・12タイプ定義
│   ├── types.ts          # 共通型定義（Friend, FriendInput, PersonalityResult）
│   └── __tests__/
│       ├── personality.test.ts  # 診断ロジックの単体テスト
│       ├── friends.test.ts      # CRUD操作の単体テスト（fsモック）
│       └── api.test.ts          # エンドポイントの結合テスト
├── public/
│   └── index.html        # ブラウザUI（バニラHTML+CSS+JS、依存なし）
├── data/
│   └── friends.json      # 自己紹介データ（永続化ストレージ）
├── docs/
│   ├── openapi.yaml      # APIスペック（OpenAPI 3.0）
│   └── design.md         # 設計書・引き継ぎドキュメント
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

---

## APIエンドポイント一覧

| メソッド | パス | 概要 |
|----------|------|------|
| `GET` | `/api/friends` | 全件取得 |
| `GET` | `/api/friends/:id` | ID指定取得 |
| `POST` | `/api/friends` | 新規登録 |
| `PUT` | `/api/friends/:id` | 更新 |
| `DELETE` | `/api/friends/:id` | 削除 |
| `GET` | `/api/personality?pace=&sociability=&focus=&attitude=` | 性格診断 |

詳細スキーマは [`docs/openapi.yaml`](docs/openapi.yaml) を参照してください。

---

## 開発コマンド

```bash
npm run dev        # tsx watchモードで起動（ホットリロードあり）
npm run build      # TypeScriptビルド
npm start          # ビルド済みを起動
npm test           # テストを1回実行
npm run test:watch # ウォッチモードでテスト
```

---

## 技術スタック

- **サーバー**: [Hono](https://hono.dev/) + [@hono/node-server](https://github.com/honojs/node-server)
- **言語**: TypeScript (ESNext + NodeNext modules)
- **フロントエンド**: バニラHTML / CSS / JavaScript（ビルドツールなし）
- **データ永続化**: `data/friends.json`（ファイルベース、DBなし）
- **実行**: [tsx](https://github.com/privatenumber/tsx)（開発時）

設計の詳細・引き継ぎ情報は [`docs/design.md`](docs/design.md) にまとめています。
