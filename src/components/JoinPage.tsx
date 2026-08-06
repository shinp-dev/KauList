import { jsx } from 'hono/jsx'
import { Layout } from './Layout'
import { MainCharacterImage } from './CowAssets'

export const JoinPage = (props: { token: string }) => {
  return (
    <Layout title="リストへの参加">
      <div class="surface-card" style="max-width: 380px; margin: 3.5rem auto; text-align: center; padding: 2rem 1.5rem;">
        <MainCharacterImage size={64} style="margin-bottom: 0.75rem;" />
        <h2 style="font-size: 1.3rem; margin-top: 0; margin-bottom: 0.35rem;">買い物リストへの招待</h2>
        <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;">
          KauList の共有買い物リストに参加します。
        </p>
        <div id="error-message" class="alert-error" style="display: none; margin-bottom: 1rem;"></div>
        
        {/* Token dataset bridge */}
        <div id="join-data" data-token={props.token} style="display: none;"></div>
        
        <button id="btn-accept-invite" class="btn btn-primary" style="width: 100%; padding: 0.65rem;">
          リストに参加する
        </button>
      </div>
    </Layout>
  )
}
