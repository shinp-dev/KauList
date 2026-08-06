import { html } from 'hono/html'

const SITE_DOMAIN = 'https://kaulist.shinp-studio.com'

export const Layout = (props: {
  title: string
  children?: any
  user?: any
  lists?: any[]
  currentListId?: number
  canonicalUrl?: string
  ogImageUrl?: string
}) => {
  const canonical = props.canonicalUrl || SITE_DOMAIN
  const ogImage = props.ogImageUrl || `${SITE_DOMAIN}/assets/icon.png`

  return html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} - KauList</title>
  <meta name="description" content="KauList（カウリスト）は「買うリスト」を、かわいく・わかりやすく・誰かと共有できる買い物リストアプリです。">
  <link rel="icon" href="/assets/icon.png" type="image/png">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${props.title} - KauList">
  <meta property="og:description" content="「買うリスト」を、かわいく・わかりやすく・誰かと共有できるアプリ">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="KauList">
  <link rel="stylesheet" href="/style.css">
  <script src="/static/js/main.js" defer></script>
</head>
<body>
  ${props.user ? html`
    <header class="site-header">
      <div class="header-container">
        <div class="header-top-row">
          <a href="/" class="brand-logo">
            <img src="/assets/icon.png" alt="KauList" />
            <span>KauList</span>
          </a>

          ${props.lists && props.lists.length > 0 ? html`
            <div class="header-switcher-desktop">
              <select id="list-switcher-desktop" class="form-control list-select-input" onchange="window.location.href='/lists/' + this.value">
                ${props.lists.map((l: any) => html`
                  <option value="${l.id}" ${l.id === props.currentListId ? 'selected' : ''}>${l.name}</option>
                `)}
              </select>
            </div>
          ` : ''}

          <div class="header-actions">
            <button id="btn-create-list-dialog" class="btn btn-secondary btn-sm" style="padding: 0.3rem 0.55rem; height: 32px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              <span>新規</span>
            </button>
            <span class="user-display-name">
              ${props.user.display_name}
            </span>
            <button id="logout-btn" class="btn btn-ghost btn-sm" title="ログアウト" aria-label="ログアウト" style="padding: 0.3rem 0.45rem; height: 32px; width: 32px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>

        ${props.lists && props.lists.length > 0 ? html`
          <div class="header-switcher-mobile">
            <select id="list-switcher-mobile" class="form-control list-select-input" onchange="window.location.href='/lists/' + this.value">
              ${props.lists.map((l: any) => html`
                <option value="${l.id}" ${l.id === props.currentListId ? 'selected' : ''}>${l.name}</option>
              `)}
            </select>
          </div>
        ` : ''}
      </div>
    </header>
  ` : ''}
  
  <main class="main-container">
    ${props.children}
  </main>
  
  <dialog id="create-list-dialog">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
      <h3 style="font-size: 1rem; margin: 0;">新規リスト作成</h3>
      <button type="button" id="btn-close-create-list" class="btn btn-ghost btn-sm" style="padding: 0.15rem 0.35rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <p style="font-size: 0.8rem; color: var(--color-text-muted); margin: 0 0 0.85rem 0; line-height: 1.4;">
      無料プランでは、自分のリストを1つまで作成できます。<br />(※共有されたリストへの参加数に上限はありません)
    </p>
    <form id="create-list-form" style="display: flex; flex-direction: column; gap: 0.85rem;">
      <div class="form-group">
        <label for="new-list-name" class="form-label">リスト名</label>
        <input type="text" id="new-list-name" class="form-control" placeholder="例: 週末のお買い物" required maxlength={50} />
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
        <button type="button" onclick="document.getElementById('create-list-dialog').close()" class="btn btn-secondary">キャンセル</button>
        <button type="submit" class="btn btn-primary">作成する</button>
      </div>
    </form>
  </dialog>
</body>
</html>`
}
