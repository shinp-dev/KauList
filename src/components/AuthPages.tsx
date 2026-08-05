import { jsx } from 'hono/jsx'
import { Layout } from './Layout'

export const LoginPage = () => {
  return (
    <Layout title="ログイン">
      <div class="card" style="max-width: 400px; margin: 4rem auto;">
        <h2 style="text-align: center; margin-top: 0;">ログイン</h2>
        <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem;">
          <div id="error-message" style="color: var(--danger); display: none;"></div>
          
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="login_id">ログインID</label>
            <input type="text" id="login_id" name="login_id" required autocomplete="username" />
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="password">パスワード</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" />
          </div>
          
          <button type="submit" class="btn-primary" style="margin-top: 1rem;">ログイン</button>
        </form>
        <p style="text-align: center; margin-top: 1.5rem;">
          アカウントをお持ちでないですか？ <a href="/register">新規登録</a>
        </p>
      </div>
    </Layout>
  )
}

export const RegisterPage = () => {
  return (
    <Layout title="新規登録">
      <div class="card" style="max-width: 400px; margin: 4rem auto;">
        <h2 style="text-align: center; margin-top: 0;">新規登録</h2>
        <form id="register-form" style="display: flex; flex-direction: column; gap: 1rem;">
          <div id="error-message" style="color: var(--danger); display: none;"></div>
          
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="login_id">ログインID</label>
            <input type="text" id="login_id" name="login_id" required minlength={3} maxlength={50} autocomplete="username" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="display_name">表示名</label>
            <input type="text" id="display_name" name="display_name" required minlength={1} maxlength={50} />
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="password">パスワード</label>
            <input type="password" id="password" name="password" required minlength={8} maxlength={128} autocomplete="new-password" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="password_confirm">パスワード確認</label>
            <input type="password" id="password_confirm" name="password_confirm" required minlength={8} maxlength={128} autocomplete="new-password" />
          </div>
          
          <button type="submit" class="btn-primary" style="margin-top: 1rem;">登録</button>
        </form>
        <p style="text-align: center; margin-top: 1.5rem;">
          すでにアカウントをお持ちですか？ <a href="/login">ログイン</a>
        </p>
      </div>
    </Layout>
  )
}
