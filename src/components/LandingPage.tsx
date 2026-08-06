import { jsx } from 'hono/jsx'
import { KauListBrandLogo, MainCharacterImage, PlusIcon, ShareIcon, ImageIcon, TagIcon } from './CowAssets'

export const LandingPage = () => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>KauList - かんたん共有買い物リスト</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        {/* Navigation Header */}
        <header class="site-header">
          <div class="header-container">
            <a href="/" class="brand-logo">
              <img src="/assets/icon.png" alt="KauList" style="width: 32px; height: 32px; border-radius: 8px;" />
              <span class="brand-font">KauList</span>
            </a>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <a href="/login" class="btn btn-ghost btn-sm">ログイン</a>
              <a href="/register" class="btn btn-primary btn-sm">使ってみる</a>
            </div>
          </div>
        </header>

        <main class="main-container" style="max-width: 900px; padding-top: 2rem;">
          {/* Hero Section */}
          <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; align-items: center; margin-bottom: 3.5rem;">
            <div>
              <div style="display: inline-block; padding: 0.25rem 0.75rem; background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: 0.8rem; font-weight: 700; border-radius: 6px; margin-bottom: 0.85rem;">
                日常で使う、やさしい買い物リスト
              </div>
              <h1 style="font-size: 2.1rem; font-weight: 800; margin-bottom: 0.85rem; color: var(--color-text); line-height: 1.25;">
                みんなで使える、<br />
                <span style="color: var(--color-primary-dark);">写真付き買い物リスト</span>
              </h1>
              <p style="font-size: 0.95rem; color: var(--color-text-muted); margin-bottom: 1.75rem; line-height: 1.7;">
                KauList（カウリスト）は、家族やパートナーと「買うもの」を共有できるシンプルなリストアプリです。写真やカテゴリ分類で、買い間違いを防ぎます。
              </p>
              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <a href="/register" class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.95rem;">
                  無料ではじめる
                </a>
                <a href="/login" class="btn btn-secondary" style="padding: 0.75rem 1.25rem; font-size: 0.95rem;">
                  ログイン
                </a>
              </div>
            </div>
            <div style="display: flex; justify-content: center;">
              <MainCharacterImage size={220} style="box-shadow: var(--shadow-md);" />
            </div>
          </section>

          {/* Features Section */}
          <section style="margin-bottom: 3.5rem;">
            <div style="text-align: center; margin-bottom: 2rem;">
              <h2 style="font-size: 1.5rem; margin-bottom: 0.35rem;">KauList の特徴</h2>
              <p style="font-size: 0.9rem; color: var(--color-text-muted);">お買い物を、シンプルに・間違いなく</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              {/* Feature 1 */}
              <div class="surface-card" style="margin-bottom: 0;">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">
                  <PlusIcon size={20} />
                </div>
                <h3 style="font-size: 1rem; margin-bottom: 0.35rem;">複数リスト対応</h3>
                <p style="font-size: 0.85rem; color: var(--color-text-muted);">
                  日用品・食品・ドラッグストアなど、目的別に複数の買い物リストを作成できます。
                </p>
              </div>

              {/* Feature 2 */}
              <div class="surface-card" style="margin-bottom: 0;">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">
                  <ShareIcon size={20} />
                </div>
                <h3 style="font-size: 1rem; margin-bottom: 0.35rem;">URLで手軽に共有</h3>
                <p style="font-size: 0.85rem; color: var(--color-text-muted);">
                  招待URLを発行して送るだけ。メンバーとリアルタイムでリストを共有できます。
                </p>
              </div>

              {/* Feature 3 */}
              <div class="surface-card" style="margin-bottom: 0;">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">
                  <ImageIcon size={20} />
                </div>
                <h3 style="font-size: 1rem; margin-bottom: 0.35rem;">商品画像で間違い防止</h3>
                <p style="font-size: 0.85rem; color: var(--color-text-muted);">
                  商品の写真を添付できるので、銘柄やパッケージの買い間違いを防止します。
                </p>
              </div>

              {/* Feature 4 */}
              <div class="surface-card" style="margin-bottom: 0;">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">
                  <TagIcon size={20} />
                </div>
                <h3 style="font-size: 1rem; margin-bottom: 0.35rem;">カテゴリで整理</h3>
                <p style="font-size: 0.85rem; color: var(--color-text-muted);">
                  食品・日用品・薬などでワンタップ分類。売り場ごとのまとめ買いがスムーズです。
                </p>
              </div>
            </div>
          </section>

          {/* How to use */}
          <section class="surface-card" style="margin-bottom: 3.5rem; padding: 2rem 1.25rem;">
            <div style="text-align: center; margin-bottom: 1.75rem;">
              <h2 style="font-size: 1.4rem; margin-bottom: 0.25rem;">使い方のながれ</h2>
              <p style="font-size: 0.85rem; color: var(--color-text-muted);">シンプルな3ステップ</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem; text-align: center;">
              <div>
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem auto; font-size: 0.85rem;">
                  1
                </div>
                <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem;">リストを作成</h4>
                <p style="font-size: 0.8rem; color: var(--color-text-muted);">新しい買い物リストを追加します。</p>
              </div>

              <div>
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem auto; font-size: 0.85rem;">
                  2
                </div>
                <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem;">招待リンクを送信</h4>
                <p style="font-size: 0.8rem; color: var(--color-text-muted);">共有URLをパートナーへ送ります。</p>
              </div>

              <div>
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem auto; font-size: 0.85rem;">
                  3
                </div>
                <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem;">買ったらチェック</h4>
                <p style="font-size: 0.8rem; color: var(--color-text-muted);">買った商品をリスト上で更新します。</p>
              </div>
            </div>
          </section>

          {/* CTA Banner */}
          <section class="surface-card" style="text-align: center; padding: 2.5rem 1.25rem; background: var(--color-primary-soft); border-color: var(--color-primary);">
            <MainCharacterImage size={72} style="margin-bottom: 0.75rem;" />
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">さあ、KauListを始めましょう</h2>
            <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 1.25rem;">登録は無料ですぐにお使いいただけます。</p>
            <a href="/register" class="btn btn-primary" style="padding: 0.75rem 1.75rem;">
              無料アカウントを作成
            </a>
          </section>
        </main>

        <footer style="border-top: 1px solid var(--color-border); background: var(--color-surface); padding: 1.75rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.85rem;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.35rem;">
            <KauListBrandLogo size={24} />
          </div>
          <p>© 2026 KauList - 共有買い物リスト</p>
        </footer>
      </body>
    </html>
  )
}
