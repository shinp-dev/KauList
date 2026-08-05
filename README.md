# Shared Shopper 🛒

買い物リストをユーザー間で共有できる、シンプルな買い物リスト管理アプリケーションです。

## 概要

「Shared Shopper」は、個人アカウントを作成し、複数の「買い物リスト」を作成・共有できるサービスです。
家族、同棲相手、ルームシェア、実家への買い物支援など、さまざまなグループや用途で利用できます。

## 主な機能

- **個人アカウント管理**: ユーザー名とパスワードによる認証
- **複数リスト管理**: 用途ごとに複数の買い物リストを作成・切り替え
- **招待コードによる共有**: オーナーが発行した招待URLから、他のユーザーがリストに参加可能
- **権限管理**:
  - `owner` (作成者): リスト名変更、リスト削除、メンバー管理、招待コード発行・失効
  - `member` (招待されたユーザー): リストの閲覧、商品の追加・更新・削除
- **商品画像添付 (Signed Upload)**: Cloudinaryを活用し、サーバーを経由せずに画像を安全に直接アップロード。画像付きの分かりやすい商品管理が可能。
- **カテゴリ分類**: 食品、日用品、薬・衛生用品、その他の4カテゴリで分類。

## 技術スタック

- **プラットフォーム**: Cloudflare Workers
- **フレームワーク**: Hono (モジュラーモノリス構成)
- **データベース**: Cloudflare D1
- **画像ストレージ**: Cloudinary
- **フロントエンド**: Hono JSX + Vanilla JS / CSS
- **認証**: サーバーサイドセッション (HttpOnly Cookie), PBKDF2-SHA256ハッシュ

## セキュリティ設計

- **サーバーサイドセッション**: セッション情報をデータベースで管理し、Cookieには推測不能な乱数トークンのみを保存。
- **アクセス制御**: `requireListMember`、`requireListOwner` などのミドルウェアでリストごとの権限を厳格にチェック。
- **CSRF対策**: Origin/Hostヘッダーの検証と、JSON `Content-Type` の強制。
- **画像ライフサイクル管理**: 未使用の画像（予約済み・一時アップロード・削除失敗）は定期バッチ (`waitUntil`) により確実にクリーンアップ。
- **レート制限**: D1を用いたログインID/IP/リストID単位でのレート制限。※ これは簡易的な制限であり、本番環境ではCloudflare WAF等の併用が推奨されます。

## ローカル環境構築

### 前提条件
- Node.js (v20以上推奨)
- Cloudinary アカウント (画像アップロード機能を使用する場合)

### 1. リポジトリのクローンと依存関係インストール
```bash
npm install
```

### 2. 環境変数の設定
`.dev.vars` ファイルを作成し、Cloudinaryの認証情報を設定してください。
※ 画像機能を使用しない場合はダミー値でも起動は可能ですが、アップロード機能はエラーになります。

```env
CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. データベースの初期化
本アプリケーションは、バージョンアップに伴い既存データ（家族モデル）と互換性のない新しいデータベース構成（共有リストモデル）へと刷新されました。

> **注意 (破壊的マイグレーション)**:
> `migrations/0004_rebuild_to_shared_lists.sql` は既存のテーブルをすべて `DROP` し、新しい構造に作り直します。既存データはすべて削除されるため、適用には十分ご注意ください。

```bash
# マイグレーションの実行 (既存データをすべて破棄して新スキーマを作成)
npx wrangler d1 execute family-shopper-db --file=migrations/0004_rebuild_to_shared_lists.sql --local
```

### 4. 開発サーバーの起動
```bash
npm run dev
```
`http://localhost:5173` でアプリケーションにアクセスできます。

## テストとビルド

```bash
# 型チェック
npm run typecheck

# ユニットテスト / 統合テスト
npm run test

# プロダクションビルド
npm run build
```

## デプロイ

Cloudflare Pages / Workers へのデプロイコマンド：

```bash
npm run deploy
```
本番環境へデプロイ後、CloudflareダッシュボードからD1バインディングおよび環境変数の設定を行ってください。
本番用のデータベース初期化も忘れずに実施してください。

```bash
npx wrangler d1 execute family-shopper-db --file=migrations/0004_rebuild_to_shared_lists.sql --remote
```
