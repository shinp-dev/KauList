import { jsx } from 'hono/jsx'
import { KauListBrandLogo, MainCharacterImage, PlusIcon, ShareIcon, ImageIcon, TagIcon } from './CowAssets'

export const LandingPage = (props?: { canonicalUrl?: string, ogImageUrl?: string }) => {
  const canonical = props?.canonicalUrl || ''
  const ogImage = props?.ogImageUrl || '/assets/icon.png'

  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>KauList - かんたん共有買い物リスト</title>
        <meta name="description" content="KauList（カウリスト）は「買うリスト」を、かわいく・わかりやすく・誰かと共有できる買い物リストアプリです。" />
        <link rel="icon" href="/assets/icon.png" type="image/png" />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:title" content="KauList - かんたん共有買い物リスト" />
        <meta property="og:description" content="「買うリスト」を、かわいく・わかりやすく・誰かと共有できるアプリ" />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="KauList" />
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        {/* Navigation Header */}
        <header class="site-header">
          <div class="header-container" style="max-width: var(--max-width-lp);">
            <a href="/" class="brand-logo">
              <img src="/assets/icon.png" alt="KauList" style="width: 32px; height: 32px; border-radius: 8px;" />
              <span class="brand-font" style="font-size: 1.35rem;">KauList</span>
            </a>
            <div style="display: flex; gap: 0.6rem; align-items: center;">
              <a href="/login" class="btn btn-secondary" style="padding: 0.45rem 1rem; height: 36px;">ログイン</a>
              <a href="/register" class="btn btn-primary" style="padding: 0.45rem 1.1rem; height: 36px;">使ってみる</a>
            </div>
          </div>
        </header>

        <main class="main-container" style="max-width: var(--max-width-lp); padding-top: 2.5rem; padding-bottom: 3.5rem;">
          {/* Hero Section */}
          <section style="position: relative; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem; align-items: center; margin-bottom: 4.5rem; padding: 1rem 0;">
            
            {/* Organic Cow Spot Background Accents */}
            <div style="position: absolute; top: -20px; right: -20px; width: 220px; height: 200px; background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath fill='%23252525' fill-opacity='0.025' d='M120,20 C160,10 190,40 180,90 C170,140 130,170 80,160 C40,150 10,110 30,60 C50,10 80,30 120,20 Z'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; pointer-events: none; z-index: -1;"></div>
            <div style="position: absolute; bottom: -30px; left: -20px; width: 220px; height: 200px; background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath fill='%23252525' fill-opacity='0.025' d='M70,30 C120,15 160,50 150,110 C140,160 90,185 40,170 C10,155 -10,110 10,60 C30,20 40,45 70,30 Z'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; pointer-events: none; z-index: -1;"></div>

            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <div style="display: inline-block; padding: 0.35rem 0.9rem; background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: 0.875rem; font-weight: 700; border-radius: 8px; margin-bottom: 1.1rem;">
                日常で使う、やさしい買い物リスト
              </div>
              <h1 style="font-size: 2.75rem; font-weight: 800; margin-bottom: 1.1rem; color: var(--color-text); line-height: 1.2; text-align: left;">
                みんなで使える、<br />
                <span style="color: var(--color-primary-dark);">写真付き買い物リスト</span>
              </h1>
              <p style="font-size: 1.05rem; color: var(--color-text-muted); margin-bottom: 2rem; line-height: 1.75; text-align: left;">
                KauList（カウリスト）は、家族やパートナーと「買うもの」を共有できるシンプルなリストアプリです。写真やカテゴリ分類で、買い間違いを防ぎます。
              </p>
              <div style="display: flex; gap: 0.85rem; flex-wrap: wrap; align-items: center;">
                <a href="/register" class="btn btn-primary" style="padding: 0.75rem 1.85rem; font-size: 1.05rem; height: 46px;">
                  無料ではじめる
                </a>
                <a href="/login" class="btn btn-secondary" style="padding: 0.75rem 1.5rem; font-size: 1.05rem; height: 46px;">
                  ログイン
                </a>
              </div>
            </div>

            {/* Hero Cow Mascot Image */}
            <div style="display: flex; justify-content: center; align-items: center;">
              <MainCharacterImage size={280} style="box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-radius: 24px;" />
            </div>
          </section>

          {/* Features Section (Responsive 4-col / 2-col / 1-col Grid) */}
          <section style="margin-bottom: 4.5rem;">
            <div style="text-align: center; margin-bottom: 2.5rem;">
              <h2 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.4rem;">KauList の特徴</h2>
              <p style="font-size: 1rem; color: var(--color-text-muted);">お買い物を、シンプルに・間違いなく</p>
            </div>

            <div class="lp-features-grid">
              {/* Feature 1 */}
              <div class="lp-feature-card">
                <div style="width: 46px; height: 46px; border-radius: 12px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin-bottom: 0.9rem; flex-shrink: 0;">
                  <PlusIcon size={24} />
                </div>
                <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.45rem;">複数リスト対応</h3>
                <p style="font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.6;">
                  日用品・食品・ドラッグストアなど、目的別に複数の買い物リストを作成できます。
                </p>
              </div>

              {/* Feature 2 */}
              <div class="lp-feature-card">
                <div style="width: 46px; height: 46px; border-radius: 12px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin-bottom: 0.9rem; flex-shrink: 0;">
                  <ShareIcon size={24} />
                </div>
                <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.45rem;">URLで手軽に共有</h3>
                <p style="font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.6;">
                  招待URLを発行して送るだけ。メンバーとリアルタイムでリストを共有できます。
                </p>
              </div>

              {/* Feature 3 */}
              <div class="lp-feature-card">
                <div style="width: 46px; height: 46px; border-radius: 12px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin-bottom: 0.9rem; flex-shrink: 0;">
                  <ImageIcon size={24} />
                </div>
                <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.45rem;">商品画像で間違い防止</h3>
                <p style="font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.6;">
                  商品の写真を添付できるので、銘柄やパッケージの買い間違いを防止します。
                </p>
              </div>

              {/* Feature 4 */}
              <div class="lp-feature-card">
                <div style="width: 46px; height: 46px; border-radius: 12px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin-bottom: 0.9rem; flex-shrink: 0;">
                  <TagIcon size={24} />
                </div>
                <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.45rem;">カテゴリで整理</h3>
                <p style="font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.6;">
                  食品・日用品・薬などでワンタップ分類。売り場ごとのまとめ買いがスムーズです。
                </p>
              </div>
            </div>
          </section>

          {/* How to use Section */}
          <section class="surface-card" style="margin-bottom: 4.5rem; padding: 2.25rem 1.5rem;">
            <div style="text-align: center; margin-bottom: 2rem;">
              <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 0.35rem;">使い方のながれ</h2>
              <p style="font-size: 0.95rem; color: var(--color-text-muted);">シンプルな3ステップ</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; text-align: center;">
              <div>
                <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem auto; font-size: 0.95rem;">
                  1
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.35rem;">リストを作成</h4>
                <p style="font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.5;">新しい買い物リストを追加します。</p>
              </div>

              <div>
                <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem auto; font-size: 0.95rem;">
                  2
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.35rem;">招待リンクを送信</h4>
                <p style="font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.5;">共有URLをパートナーへ送ります。</p>
              </div>

              <div>
                <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem auto; font-size: 0.95rem;">
                  3
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.35rem;">買ったらチェック</h4>
                <p style="font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.5;">買った商品をリスト上で更新します。</p>
              </div>
            </div>
          </section>

          {/* Prominent CTA Banner */}
          <section class="surface-card" style="text-align: center; padding: 3rem 1.5rem; background: var(--color-primary-soft); border-color: var(--color-primary); margin-bottom: 0;">
            <MainCharacterImage size={96} style="margin-bottom: 1rem;" />
            <h2 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.65rem; color: var(--color-text);">さあ、KauListを始めましょう</h2>
            <p style="font-size: 1.05rem; color: var(--color-text-muted); margin-bottom: 1.5rem;">登録は無料ですぐにお使いいただけます。</p>
            <a href="/register" class="btn btn-primary" style="padding: 0.9rem 2.25rem; font-size: 1.05rem; height: 48px;">
              無料アカウントを作成
            </a>
          </section>
        </main>

        <footer style="border-top: 1px solid var(--color-border); background: var(--color-surface); padding: 2rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.875rem;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.45rem;">
            <KauListBrandLogo size={26} />
          </div>
          <p>© 2026 KauList - 共有買い物リスト</p>
        </footer>
      </body>
    </html>
  )
}
