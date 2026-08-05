import { jsx } from 'hono/jsx'
import { Layout } from './Layout'

export const JoinPage = (props: { token: string }) => {
  return (
    <Layout title="リストへの参加">
      <div class="card" style="max-width: 400px; margin: 4rem auto; text-align: center;">
        <h2 style="margin-top: 0;">共有リストへの招待</h2>
        <p>買い物リストへの招待を受け取りました。</p>
        <div id="error-message" style="color: var(--danger); display: none; margin-bottom: 1rem;"></div>
        
        {/* We pass token in data attribute to be picked up by main.js */}
        <div id="join-data" data-token={props.token} style="display: none;"></div>
        
        <button id="btn-accept-invite" class="btn-primary" style="width: 100%;">参加する</button>
      </div>
    </Layout>
  )
}
