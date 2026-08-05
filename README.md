# Family Shopper 🛒

家族で同じお買い物リストを共有・管理できる、シンプルで直感的な Web アプリケーションです。
Cloudflare Workers, D1 Database, および Cloudinary を活用した、モダンで高速な SPA (Single Page Application) です。

---

## ✨ 主な機能

- **家族間でのリスト共有**: 家族で同じ買い物リストを共有し、追加や購入状態を確認できます。
- **写真付きアイテム管理**: Cloudinaryの署名付きアップロード（Signed Upload）により、商品写真を追加できます。アップロードに失敗した一時画像や商品から削除された画像は、サーバー側で順次クリーンアップされます。
- **拡大表示**: リストの画像サムネイルをタップすると、大画面で詳細を確認できます。
- **家族メンバー管理**: 管理者が家族用のメンバーアカウント（8文字以上のパスワード）を発行・管理できます。
- **カテゴリフィルタ**: 「父用」「母用」「子ども用」「その他」（4種類固定）でリストを素早く絞り込み。
- **入力補完**: 過去に入力した商品名を端末内で記憶し、候補表示（データリスト）をサポート。
- **モバイル対応**: スマホのカメラやギャラリーから直接アップロードできるUI。

### ⚠️ 機能に関する注記
- **更新方式**: 画面の操作や手動更新を行った際に最新状態を取得します（自動リアルタイム通信には未対応です）。
- **入力履歴**: 商品名の入力履歴は、サーバーではなくご利用の端末（LocalStorage）に保存されます。
- **形態**: 本アプリは Web アプリケーションです（ネイティブアプリやオフライン利用、メール通知には対応していません）。

---

## 🔒 データ保存先とセキュリティ

| データ種別 | 保存先 / 方式 | 説明 |
| :--- | :--- | :--- |
| **商品・家族・ユーザー情報** | **Cloudflare D1** | SQLite 互換のリレーショナルデータベース |
| **商品写真** | **Cloudinary** | クラウドストレージ（`uploaded_images` テーブルで所有権を厳格に管理） |
| **商品名入力履歴** | **LocalStorage** | ご利用端末のブラウザ内（`familyName` と `username` ごとに分離） |
| **パスワード** | **PBKDF2-SHA256** | 100,000 回のソルト付きハッシュ化 |
| **ログイン状態** | **署名付き Cookie** | `COOKIE_SECRET` で署名された HttpOnly / Secure / SameSite Cookie |
| **APIアクセス制限** | **Cloudflare D1** | 簡易的なレート制限（本格的なWAFの代替ではありません。DB障害時はフェイルオープンします） |

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
| `CLOUDINARY_API_KEY` | **必須** | Cloudinary の API Key (署名・画像削除用) |
| `CLOUDINARY_API_SECRET` | **必須** | Cloudinary の API Secret (署名・画像削除用) |

---

### 2. データベースの構築・マイグレーション

**【新規構築の場合】**
`schema.sql` はテーブルを初期から作成するためのファイルです（`DROP TABLE`等の破壊的処理を含みます。既存データがある環境には実行しないでください）。
```bash
# 新規ローカル環境のD1データベース作成
npx wrangler d1 execute family-shopper-db --file=schema.sql --local
```

**【既存環境の更新（マイグレーション）の場合】**
`migrations/` フォルダ内の非破壊マイグレーションSQLファイルを使用します。
実行前に必ず `wrangler d1 export` コマンドでデータのバックアップを取得してください。
```bash
# 本番データベースのバックアップ取得
npx wrangler d1 export family-shopper-db --remote --output=./backup.sql

# 本番DBへのマイグレーション適用例（番号順にすべて実行してください）
npx wrangler d1 execute family-shopper-db --file=migrations/0001_add_rate_limits.sql --remote
npx wrangler d1 execute family-shopper-db --file=migrations/0002_add_uploaded_images.sql --remote
npx wrangler d1 execute family-shopper-db --file=migrations/0003_harden_uploaded_images.sql --remote
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
   - メイン画面で欲しい商品を追加します。必要に応じて写真を撮っておくと便利です。
4. **購入完了**:
   - お店で購入したら、リストのアイテムをタップして完了（チェック）にします。
5. **削除**:
   - 不要になったアイテムはゴミ箱アイコンで削除します（Cloudinary 上の画像も連動して削除を試みます。万が一削除に失敗した場合は、一定確率で再試行用レコードが処理されます）。

---

## 📄 ライセンス

MIT
