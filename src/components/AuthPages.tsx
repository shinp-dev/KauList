import { jsx } from 'hono/jsx'
import { Layout } from './Layout'
import { CowLogoIcon } from './CowAssets'

export const LoginPage = () => {
  return (
    <Layout title="ログイン">
      <div class="card" style="max-width: 420px; margin: 3rem auto; padding: 2.25rem 1.75rem;">
        <div style="text-align: center; margin-bottom: 1.75rem;">
          <CowLogoIcon size={52} style="margin-bottom: 0.5rem;" />
          <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">KauList にログイン</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">共有買い物リストをはじめましょう</p>
        </div>

        <form id="login-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div id="error-message" class="alert-error" style="display: none;"></div>
          
          <div class="form-group">
            <label for="login_id" class="form-label">ログインID</label>
            <input type="text" id="login_id" name="login_id" class="form-control" placeholder="ユーザーIDを入力" required autocomplete="username" />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">パスワード</label>
            <input type="password" id="password" name="password" class="form-control" placeholder="パスワードを入力" required autocomplete="current-password" />
          </div>
          
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;">
            ログインする ➔
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--border); font-size: 0.9rem; color: var(--text-muted);">
          アカウントをお持ちでないですか？ <a href="/register" style="font-weight: 700;">新規登録（無料）</a>
        </div>
      </div>
    </Layout>
  )
}

export const RegisterPage = () => {
  return (
    <Layout title="新規登録">
      <div class="card" style="max-width: 440px; margin: 3rem auto; padding: 2.25rem 1.75rem;">
        <div style="text-align: center; margin-bottom: 1.75rem;">
          <CowLogoIcon size={52} style="margin-bottom: 0.5rem;" />
          <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">KauList アカウント登録</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">無料ですぐにご利用いただけます</p>
        </div>

        <form id="register-form" style="display: flex; flex-direction: column; gap: 1.15rem;">
          <div id="error-message" class="alert-error" style="display: none;"></div>
          
          <div class="form-group">
            <label for="login_id" class="form-label">ログインID <span style="color: var(--danger);">*</span></label>
            <input type="text" id="login_id" name="login_id" class="form-control" placeholder="半角英数字3文字以上" required minlength={3} maxlength={50} autocomplete="username" />
          </div>

          <div class="form-group">
            <label for="display_name" class="form-label">表示名 <span style="color: var(--danger);">*</span></label>
            <input type="text" id="display_name" name="display_name" class="form-control" placeholder="例: お父さん、たろう" required minlength={1} maxlength={50} />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">パスワード <span style="color: var(--danger);">*</span></label>
            <input type="password" id="password" name="password" class="form-control" placeholder="8文字以上のパスワード" required minlength={8} maxlength={128} autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label for="password_confirm" class="form-label">パスワード確認 <span style="color: var(--danger);">*</span></label>
            <input type="password" id="password_confirm" name="password_confirm" class="form-control" placeholder="パスワードを再入力" required minlength={8} maxlength={128} autocomplete="new-password" />
          </div>
          
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;">
            登録してはじめる ➔
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--border); font-size: 0.9rem; color: var(--text-muted);">
          すでにアカウントをお持ちですか？ <a href="/login" style="font-weight: 700;">ログイン</a>
        </div>
      </div>
    </Layout>
  )
}
