import { jsx } from 'hono/jsx'
import { Layout } from './Layout'
import { MainCharacterImage } from './CowAssets'

export const LoginPage = () => {
  return (
    <Layout title="ログイン">
      <div class="surface-card" style="max-width: 380px; margin: 3rem auto; padding: 2rem 1.5rem;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <MainCharacterImage size={64} style="margin-bottom: 0.5rem;" />
          <h2 style="font-size: 1.35rem; margin-bottom: 0.2rem;">KauList にログイン</h2>
          <p style="font-size: 0.85rem; color: var(--color-text-muted);">買い物リストをはじめましょう</p>
        </div>

        <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem;">
          <div id="error-message" class="alert-error" style="display: none;"></div>
          
          <div class="form-group">
            <label for="login_id" class="form-label">ログインID</label>
            <input type="text" id="login_id" name="login_id" class="form-control" placeholder="ユーザーIDを入力" required autocomplete="username" />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">パスワード</label>
            <input type="password" id="password" name="password" class="form-control" placeholder="パスワードを入力" required autocomplete="current-password" />
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem; padding: 0.65rem;">
            ログインする
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border); font-size: 0.85rem; color: var(--color-text-muted);">
          アカウントをお持ちでないですか？ <a href="/register" style="font-weight: 700;">新規登録</a>
        </div>
      </div>
    </Layout>
  )
}

export const RegisterPage = () => {
  return (
    <Layout title="新規登録">
      <div class="surface-card" style="max-width: 400px; margin: 3rem auto; padding: 2rem 1.5rem;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <MainCharacterImage size={64} style="margin-bottom: 0.5rem;" />
          <h2 style="font-size: 1.35rem; margin-bottom: 0.2rem;">アカウント登録</h2>
          <p style="font-size: 0.85rem; color: var(--color-text-muted);">無料で手軽にご利用いただけます</p>
        </div>

        <form id="register-form" style="display: flex; flex-direction: column; gap: 1rem;">
          <div id="error-message" class="alert-error" style="display: none;"></div>
          
          <div class="form-group">
            <label for="login_id" class="form-label">ログインID</label>
            <input type="text" id="login_id" name="login_id" class="form-control" placeholder="半角英数字3文字以上" required minlength={3} maxlength={50} autocomplete="username" />
          </div>

          <div class="form-group">
            <label for="display_name" class="form-label">表示名</label>
            <input type="text" id="display_name" name="display_name" class="form-control" placeholder="例: たろう" required minlength={1} maxlength={50} />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">パスワード</label>
            <input type="password" id="password" name="password" class="form-control" placeholder="8文字以上" required minlength={8} maxlength={128} autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label for="password_confirm" class="form-label">パスワード確認</label>
            <input type="password" id="password_confirm" name="password_confirm" class="form-control" placeholder="パスワードを再入力" required minlength={8} maxlength={128} autocomplete="new-password" />
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem; padding: 0.65rem;">
            登録してはじめる
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border); font-size: 0.85rem; color: var(--color-text-muted);">
          すでにアカウントをお持ちですか？ <a href="/login" style="font-weight: 700;">ログイン</a>
        </div>
      </div>
    </Layout>
  )
}
