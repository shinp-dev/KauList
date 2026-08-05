import { html } from 'hono/html'
import { jsx } from 'hono/jsx'

export const Layout = (props: { title: string, children?: any, user?: any, lists?: any[], currentListId?: number }) => {
  return html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} - Shared Shopper</title>
  <style>
    :root {
      --primary: #4F46E5;
      --primary-hover: #4338CA;
      --bg: #F9FAFB;
      --surface: #FFFFFF;
      --text: #111827;
      --text-light: #6B7280;
      --border: #E5E7EB;
      --danger: #EF4444;
      --success: #10B981;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    header {
      background-color: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .logo {
      font-weight: bold;
      font-size: 1.25rem;
      color: var(--primary);
      text-decoration: none;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .main-container {
      flex: 1;
      max-width: 1000px;
      margin: 2rem auto;
      width: 100%;
      padding: 0 1rem;
    }
    .card {
      background: var(--surface);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    input, select, button {
      font-family: inherit;
      font-size: 1rem;
      padding: 0.5rem;
      border: 1px solid var(--border);
      border-radius: 4px;
    }
    button {
      cursor: pointer;
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .btn-primary {
      background: var(--primary);
      color: white;
      border: none;
    }
    .btn-primary:hover {
      background: var(--primary-hover);
    }
    .btn-danger {
      background: var(--danger);
      color: white;
      border: none;
    }
  </style>
  <script src="/static/js/main.js" defer></script>
</head>
<body>
  ${props.user ? html`
    <header>
      <div class="header-left">
        <a href="/" class="logo">Shared Shopper</a>
        ${props.lists && props.lists.length > 0 ? html`
          <select id="list-switcher" onchange="window.location.href='/lists/' + this.value">
            ${props.lists.map((l: any) => html`
              <option value="${l.id}" ${l.id === props.currentListId ? 'selected' : ''}>${l.name}</option>
            `)}
          </select>
        ` : ''}
        <button id="btn-create-list-dialog" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">＋ 新規リスト</button>
      </div>
      <div class="header-right">
        <span>${props.user.display_name}</span>
        <button id="logout-btn">ログアウト</button>
      </div>
    </header>
  ` : ''}
  
  <main class="main-container">
    ${props.children}
  </main>
  
  <dialog id="create-list-dialog" style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 1.5rem; max-width: 400px; width: 100%;">
    <h3 style="margin-top: 0;">新規リスト作成</h3>
    <form id="create-list-form" style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <label for="new-list-name">リスト名</label>
        <input type="text" id="new-list-name" required maxlength="50" />
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
        <button type="button" id="btn-close-create-list">キャンセル</button>
        <button type="submit" class="btn-primary">作成</button>
      </div>
    </form>
  </dialog>
</body>
</html>`
}
