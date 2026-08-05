# Family Shopper 🛒

家族で同じお買い物リストを共有・管理できる、シンプルで直感的な Web アプリケーションです。
Cloudflare Workers, D1 Database, および Cloudinary を活用した、モダンで高速な SPA (Single Page Application) です。

---

## ✨ 主な機能

- **家族間でのリスト共有**: 家族で同じ買い物リストを共有し、追加や購入状態（完了チェック）を確認できます。
- **写真付きアイテム管理**: Cloudinary 連携により、カメラで撮影した商品写真や画像を添えてリストへ追加。
- **拡大表示**: リストの画像サムネイルをタップすると、大画面で詳細を確認できます。
- **家族メンバー管理**: 管理者が家族用のメンバーアカウント（8文字以上のパスワード）を自由に発行・管理。
- **カテゴリフィルタ**: 「父用」「母用」「子ども用」「その他」（4種類固定）でリストを素早く絞り込み。
- **入力補完**: 過去に入力した商品名を端末内で記憶し、候補表示（データリスト）をサポート。
- **モバイル最適化**: スマホのカメラやギャラリーから直接アップロードできるレスポンシブな UI。

### ⚠️ 機能に関する注記
- **更新方式**: 画面の操作（追加・チェック切り替え・削除）や手動更新を行った際に最新状態を取得します（WebSocket や Push 通知等による自動リアルタイム通信には未対応です）。
- **入力履歴**: 商品名の入力履歴は、サーバーではなくご利用の端末（LocalStorage）に保存されます。
- **形態**: 本アプリは Web アプリケーションです（ネイティブアプリやオフライン利用、メール通知には対応していません）。

---

## 🔒 データ保存先とセキュリティ

| データ種別 | 保存先 / 方式 | 説明 |
| :--- | :--- | :--- |
| **商品・家族・ユーザー情報** | **Cloudflare D1** | SQLite 互換のリレーショナルデータベース |
| **商品写真** | **Cloudinary** | クラウドストレージ |
| **商品名入力履歴** | **LocalStorage** | ご利用端末のブラウザ内（`familyName` と `username` ごとに分離） |
| **パスワード** | **PBKDF2-SHA256** | 100,000 回のソルト付きハッシュ化 |
| **ログイン状態** | **署名付き Cookie** | `COOKIE_SECRET` で署名された HttpOnly / Secure / SameSite Cookie |

---

## 🚀 テクノロジースタック

- **Frontend/Backend**: [Hono](https://hono.dev/) (Vite)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **Storage**: [Cloudinary](https://cloudinary.com/) (画像保存)
- **Language**: TypeScript

---

## 🛠️ セットアップとデプロイ手順

### 1. 環境変数の設定

Cloudflare のダッシュボードまたは `wrangler` にて、以下の環境変数を設定してください。

| 名前 | 必須 | 説明 |
| :--- | :---: | :--- |
| `COOKIE_SECRET` | **必須** | **セッション署名用秘密鍵**（十分に長いランダムな文字列を設定してください） |
| `ADMIN_USER` | **必須** | 初回システム管理者のログインユーザー名 |
| `ADMIN_PASS` | **必須** | 初回システム管理者のログインパスワード（8文字以上推奨） |
| `CLOUD_NAME` | **必須** | Cloudinary の Cloud Name |
| `UPLOAD_PRESET` | **必須** | Cloudinary の Unsigned Upload Preset |
| `CLOUDINARY_API_KEY` | **必須** | Cloudinary の API Key (画像削除用) |
| `CLOUDINARY_API_SECRET` | **必須** | Cloudinary の API Secret (画像削除用) |

---

### 2. データベースの初期化・セットアップ

> [!CAUTION]
> `schema_refactor.sql` はテーブルの再作成（`DROP TABLE IF EXISTS`）を含みます。**既存のデータを初期化**しますので実行時はご注意ください。

```bash
# ローカル環境のD1データベース作成・適用
npx wrangler d1 execute family-shopper-db --file=schema_refactor.sql --local

# リモート（本番）D1データベースへの反映
npx wrangler d1 execute family-shopper-db --file=schema_refactor.sql --remote
```

---

### 3. ローカル開発サーバーの起動

```bash
npm install
npm run dev
```

---

### 4. デプロイ

```bash
npm run deploy
```

---

## 📖 使い方

1. **初期ログイン / 家族グループ登録**:
   - 既存の管理者資格情報でログインするか、「新しい家族（グループ）を作成する」から登録します。
2. **家族メンバーの追加**:
   - 管理者ページから、家族のユーザー名とパスワード（8文字以上）を登録します。
3. **お買い物リストの作成**:
   - メイン画面で欲しい商品を追加します。必要に応じて写真を撮っておくと、買い間違いを防止できます。
4. **購入完了**:
   - お店で購入したら、リストのアイテムをタップして完了（チェック）にします。
5. **削除**:
   - 不要になったアイテムはゴミ箱アイコンで削除します（Cloudinary 上の画像も連動して削除されます）。

---

## 📄 ライセンス

MIT
