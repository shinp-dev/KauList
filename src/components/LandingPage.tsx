import { jsx } from 'hono/jsx'
import { CowLogoIcon, HeroCowMascot } from './CowAssets'

export const LandingPage = () => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>KauList - かわいい共有買い物リストアプリ</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body class="cow-bg-accent">
        {/* Navigation Header */}
        <header class="site-header">
          <div class="header-container">
            <a href="/" class="brand-logo">
              <CowLogoIcon size={36} />
              <span class="brand-font">KauList</span>
            </a>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <a href="/login" class="btn btn-ghost btn-sm">ログイン</a>
              <a href="/register" class="btn btn-primary btn-sm">使ってみる</a>
            </div>
          </div>
        </header>

        <main class="main-container" style="max-width: 1000px; padding-top: 2.5rem;">
          {/* Hero Section */}
          <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2.5rem; align-items: center; margin-bottom: 4rem;">
            <div>
              <div class="badge badge-food" style="margin-bottom: 1rem; padding: 0.35rem 0.85rem; font-size: 0.85rem;">
                🐮 かわいく・かんたんに共有
              </div>
              <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem; color: var(--text-main); line-height: 1.25;">
                みんなで使える、<br />
                <span style="color: var(--primary);">写真付き買い物リスト</span>
              </h1>
              <p style="font-size: 1.05rem; color: var(--text-muted); margin-bottom: 2rem; line-height: 1.7;">
                KauList（カウリスト）は、家族や友達、パートナーと「買うもの」を誰とでもかわいく・わかりやすく共有できるリストアプリです。写真やカテゴリ付きで買い間違いを防ぎます。
              </p>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <a href="/register" class="btn btn-primary btn-lg">
                  無料ですぐ使ってみる ➔
                </a>
                <a href="/login" class="btn btn-secondary btn-lg">
                  ログイン
                </a>
              </div>
            </div>
            <div style="display: flex; justify-content: center;">
              <HeroCowMascot width={320} height={290} />
            </div>
          </section>

          {/* Features Section */}
          <section style="margin-bottom: 4rem;">
            <div style="text-align: center; margin-bottom: 2.5rem;">
              <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem;">KauList の主な特徴</h2>
              <p style="color: var(--text-muted);">いつものお買い物を、もっと便利でたのしく</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
              {/* Feature 1 */}
              <div class="card" style="margin-bottom: 0;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1rem;">
                  📋
                </div>
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">複数リスト対応</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">
                  「今週末のBBQ」「日常の食品」「ドラッグストア」など、目的別に複数のリストを作成して使い分けられます。
                </p>
              </div>

              {/* Feature 2 */}
              <div class="card" style="margin-bottom: 0;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #E6FFFA; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1rem;">
                  🔗
                </div>
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">招待URLでかんたん共有</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">
                  専用の招待リンクを発行して送るだけ。オーナー・メンバー権限管理で安心して共有できます。
                </p>
              </div>

              {/* Feature 3 */}
              <div class="card" style="margin-bottom: 0;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #FFF5F5; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1rem;">
                  📸
                </div>
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">商品画像をつけられる</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">
                  銘柄やパッケージ写真を登録できるので、「どれを買えばいいか分からない」悩みを解消します。
                </p>
              </div>

              {/* Feature 4 */}
              <div class="card" style="margin-bottom: 0;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #F7FAFC; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1rem;">
                  🏷️
                </div>
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">カテゴリでスッキリ整理</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">
                  食品、日用品、薬・衛生用品などのチップで分類・フィルター。売り場ごとのまとめ買いがスムーズです。
                </p>
              </div>
            </div>
          </section>

          {/* How it works Section */}
          <section style="margin-bottom: 4rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2.5rem 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="text-align: center; margin-bottom: 2rem;">
              <h2 style="font-size: 1.6rem; margin-bottom: 0.5rem;">使い方のながれ</h2>
              <p style="color: var(--text-muted);">たった3ステップで共有スタート</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; text-align: center;">
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                  1
                </div>
                <h4 style="margin-bottom: 0.5rem;">リストを作成</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">アプリで新しい買い物リストを追加します。</p>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                  2
                </div>
                <h4 style="margin-bottom: 0.5rem;">招待リンクを送信</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">ワンタップで共有URLを発行してパートナーに送信。</p>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                  3
                </div>
                <h4 style="margin-bottom: 0.5rem;">買ったらチェック！</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">買った商品をリアルタイムにチェック・更新。</p>
              </div>
            </div>
          </section>

          {/* CTA Banner */}
          <section class="card" style="text-align: center; padding: 3rem 1.5rem; background: linear-gradient(135deg, #FFFFFF 0%, #EEF3FF 100%); border-color: var(--primary-light);">
            <CowLogoIcon size={56} style="margin-bottom: 1rem;" />
            <h2 style="font-size: 1.75rem; margin-bottom: 0.75rem;">さあ、KauListを始めよう</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">登録は無料。すぐにお買い物リストを共有できます。</p>
            <a href="/register" class="btn btn-primary btn-lg">
              無料アカウントを作成
            </a>
          </section>
        </main>

        <footer style="border-top: 1px solid var(--border); background: var(--surface); padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <CowLogoIcon size={24} />
            <span class="brand-font" style="font-weight: 800; color: var(--text-main);">KauList</span>
          </div>
          <p>© 2026 KauList - かわいく・わかりやすい共有買い物リスト</p>
        </footer>
      </body>
    </html>
  )
}
