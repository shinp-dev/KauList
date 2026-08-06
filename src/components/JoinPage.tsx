import { jsx } from 'hono/jsx'
import { Layout } from './Layout'
import { CowLogoIcon } from './CowAssets'

export const JoinPage = (props: { token: string }) => {
  return (
    <Layout title="リストへの参加">
      <div class="card" style="max-width: 420px; margin: 4rem auto; text-align: center; padding: 2.5rem 1.75rem;">
        <CowLogoIcon size={56} style="margin-bottom: 1rem;" />
        <h2 style="font-size: 1.4rem; margin-top: 0; margin-bottom: 0.5rem;">共有買い物リストへの招待</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
          KauList の共有買い物リストに参加しよう！
        </p>
        <div id="error-message" class="alert-error" style="display: none; margin-bottom: 1.25rem;"></div>
        
        {/* Token dataset bridge */}
        <div id="join-data" data-token={props.token} style="display: none;"></div>
        
        <button id="btn-accept-invite" class="btn btn-primary btn-lg" style="width: 100%;">
          🐮 リストに参加する
        </button>
      </div>
    </Layout>
  )
}
