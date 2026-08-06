import { html } from 'hono/html'

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
<body>
  ${props.user ? html`
    <header class="site-header">
      <div class="header-container">
        <!-- Left: Brand Logo -->
        <a href="/" class="brand-logo">
          <img src="/assets/icon.png" alt="KauList" />
          <span>KauList</span>
        </a>

        <!-- Center: Current List Switcher -->
        ${props.lists && props.lists.length > 0 ? html`
          <div style="flex: 1; max-width: 260px; margin: 0 0.5rem;">
            <select id="list-switcher" class="form-control" style="font-weight: 700; padding: 0.4rem 2rem 0.4rem 0.75rem; font-size: 0.875rem;" onchange="window.location.href='/lists/' + this.value">
              ${props.lists.map((l: any) => html`
                <option value="${l.id}" ${l.id === props.currentListId ? 'selected' : ''}>${l.name}</option>
              `)}
            </select>
          </div>
        ` : ''}

        <!-- Right: Actions & Profile -->
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <button id="btn-create-list-dialog" class="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            新規リスト
          </button>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted); background: var(--color-background); padding: 0.3rem 0.65rem; border-radius: 6px; border: 1px solid var(--color-border);">
            ${props.user.display_name}
          </span>
          <button id="logout-btn" class="btn btn-ghost btn-sm" title="ログアウト">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </header>
  ` : ''}
  
  <main class="main-container">
    ${props.children}
  </main>
  
  <dialog id="create-list-dialog">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3 style="font-size: 1.1rem; margin: 0;">新規リスト作成</h3>
      <button type="button" id="btn-close-create-list" class="btn btn-ghost btn-sm" style="padding: 0.2rem 0.4rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <form id="create-list-form" style="display: flex; flex-direction: column; gap: 1rem;">
      <div class="form-group">
        <label for="new-list-name" class="form-label">リスト名</label>
        <input type="text" id="new-list-name" class="form-control" placeholder="例: 週末のお買い物" required maxlength="50" />
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
