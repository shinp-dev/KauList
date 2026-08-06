import { html } from 'hono/html'
import { CowLogoIcon } from './CowAssets'

export const Layout = (props: { title: string, children?: any, user?: any, lists?: any[], currentListId?: number }) => {
  return html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} - KauList</title>
  <link rel="stylesheet" href="/style.css">
  <script src="/static/js/main.js" defer></script>
</head>
<body class="cow-bg-accent">
  ${props.user ? html`
    <header class="site-header">
      <div class="header-container">
        <div class="header-left" style="display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
          <a href="/" class="brand-logo">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" fill="#EEF3FF"/>
              <path d="M12 16C10 13 11 9 14 10C16 11 16 14 16 14" stroke="#D98A56" stroke-width="2.5" stroke-linecap="round" fill="#F4A261"/>
              <path d="M36 16C38 13 37 9 34 10C32 11 32 14 32 14" stroke="#D98A56" stroke-width="2.5" stroke-linecap="round" fill="#F4A261"/>
              <ellipse cx="24" cy="24" rx="14" ry="12" fill="#FFFFFF" stroke="#222222" stroke-width="2.5"/>
              <ellipse cx="9" cy="20" rx="4" ry="2.5" fill="#FFFFFF" stroke="#222222" stroke-width="2" transform="rotate(-20 9 20)"/>
              <ellipse cx="39" cy="20" rx="4" ry="2.5" fill="#FFFFFF" stroke="#222222" stroke-width="2" transform="rotate(20 39 20)"/>
              <ellipse cx="9" cy="20" rx="2.5" ry="1.5" fill="#FFB7B2" transform="rotate(-20 9 20)"/>
              <ellipse cx="39" cy="20" rx="2.5" ry="1.5" fill="#FFB7B2" transform="rotate(20 39 20)"/>
              <path d="M27 14C31 14 35 17 34 21C33 24 29 23 27 20C26 17 25 14 27 14Z" fill="#222222"/>
              <circle cx="18" cy="21" r="2" fill="#222222"/>
              <circle cx="30" cy="21" r="2" fill="#222222"/>
              <circle cx="18.5" cy="20.5" r="0.7" fill="#FFFFFF"/>
              <circle cx="30.5" cy="20.5" r="0.7" fill="#FFFFFF"/>
              <ellipse cx="24" cy="28" rx="8.5" ry="5.5" fill="#FFC6C7" stroke="#222222" stroke-width="2"/>
              <ellipse cx="21" cy="27.5" rx="1.2" ry="1.8" fill="#555555"/>
              <ellipse cx="27" cy="27.5" rx="1.2" ry="1.8" fill="#555555"/>
              <path d="M22.5 30.5C23.5 31.2 24.5 31.2 25.5 30.5" stroke="#222222" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="29" y="29" width="13" height="13" rx="3" fill="#4C6FFF" stroke="#FFFFFF" stroke-width="1.5"/>
              <path d="M33 29V27C33 25.5 34 24.5 35.5 24.5C37 24.5 38 25.5 38 27V29" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>KauList</span>
          </a>
          ${props.lists && props.lists.length > 0 ? html`
            <select id="list-switcher" class="form-control" style="width: auto; padding: 0.4rem 2.2rem 0.4rem 0.85rem; font-size: 0.9rem; font-weight: 700;" onchange="window.location.href='/lists/' + this.value">
              ${props.lists.map((l: any) => html`
                <option value="${l.id}" ${l.id === props.currentListId ? 'selected' : ''}>${l.name}</option>
              `)}
            </select>
          ` : ''}
          <button id="btn-create-list-dialog" class="btn btn-secondary btn-sm">＋ 新規リスト</button>
        </div>
        <div class="header-right" style="display: flex; align-items: center; gap: 0.85rem;">
          <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.4rem; background: var(--bg-subtle); padding: 0.35rem 0.75rem; border-radius: var(--radius-pill); border: 1px solid var(--border);">
            🐮 ${props.user.display_name}
          </span>
          <button id="logout-btn" class="btn btn-ghost btn-sm">ログアウト</button>
        </div>
      </div>
    </header>
  ` : ''}
  
  <main class="main-container">
    ${props.children}
  </main>
  
  <dialog id="create-list-dialog">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
      <h3 style="font-size: 1.15rem; margin: 0;">新規リスト作成</h3>
      <button type="button" id="btn-close-create-list" class="btn btn-ghost btn-sm" style="padding: 0.2rem 0.5rem; font-size: 1.1rem;">✕</button>
    </div>
    <form id="create-list-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div class="form-group">
        <label for="new-list-name" class="form-label">リスト名</label>
        <input type="text" id="new-list-name" class="form-control" placeholder="例: 週末のお買い物、ドラッグストア" required maxlength="50" />
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button type="button" onclick="document.getElementById('create-list-dialog').close()" class="btn btn-secondary">キャンセル</button>
        <button type="submit" class="btn btn-primary">作成する</button>
      </div>
    </form>
  </dialog>
</body>
</html>`
}
