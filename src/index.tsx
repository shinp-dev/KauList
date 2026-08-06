import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { getCookie } from 'hono/cookie'
import type { Bindings, Variables } from './types'
import { authRoutes } from './modules/auth/routes'
import { listsRoutes } from './modules/lists/routes'
import { membersRoutes } from './modules/members/routes'
import { invitesRoutes, inviteAcceptRoutes } from './modules/invites/routes'
import { itemsRoutes } from './modules/items/routes'
import { imagesRoutes } from './modules/images/routes'
import { ImageService } from './modules/images/service'
import { ListService } from './modules/lists/service'

// Components
import { LoginPage, RegisterPage } from './components/AuthPages'
import { ShoppingListPage } from './components/ShoppingListPage'
import { JoinPage } from './components/JoinPage'
import { Layout } from './components/Layout'
import { LandingPage } from './components/LandingPage'

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

app.use('*', secureHeaders())

app.use(async (c, next) => {
  // Common session extraction for frontend routes
  const token = getCookie(c, 'session_token')
  if (token) {
    const { hashToken } = await import('./lib/crypto')
    const tokenHash = await hashToken(token)
    const session = await c.env.DB.prepare(`
      SELECT u.id, u.login_id, u.display_name, s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = ?
    `).bind(tokenHash).first<{id: number, login_id: string, display_name: string, expires_at: string}>()

    if (session && new Date(session.expires_at) >= new Date()) {
      c.set('user', {
        id: session.id,
        login_id: session.login_id,
        display_name: session.display_name
      })
    }
  }

  if (Math.random() < 0.05) {
    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
      const imgService = new ImageService(c.env.DB, c.env)
      c.executionCtx.waitUntil(imgService.processCleanup())
    }
  }
  await next()
})

// Frontend Routes
app.get('/', async (c) => {
  const user = c.get('user')
  if (!user) return c.html(<LandingPage />)

  const listService = new ListService(c.env.DB)
  const lists = await listService.getUserLists(user.id)
  
  if (lists.length > 0) {
    return c.redirect(`/lists/${lists[0].id}`)
  } else {
    // If user has no lists, show a friendly page prompting to create one
    const EmptyListPage = () => (
      <Layout title="ホーム" user={user} lists={[]}>
        <div class="empty-state" style="margin: 3rem auto; max-width: 500px;">
          <svg width="120" height="120" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="135" rx="70" ry="12" fill="#E7E3DF" opacity="0.6" />
            <ellipse cx="90" cy="110" rx="38" ry="32" fill="#FFFFFF" stroke="#222222" stroke-width="3" />
            <path d="M70 95C80 95 86 105 78 115C70 125 60 118 58 108C56 98 62 95 70 95Z" fill="#222222" />
            <path d="M64 42C59 34 63 26 69 28C74 30 73 37 73 37" stroke="#D98A56" stroke-width="2.5" stroke-linecap="round" fill="#F4A261" />
            <path d="M116 42C121 34 117 26 111 28C106 30 107 37 107 37" stroke="#D98A56" stroke-width="2.5" stroke-linecap="round" fill="#F4A261" />
            <ellipse cx="90" cy="58" rx="30" ry="24" fill="#FFFFFF" stroke="#222222" stroke-width="3" />
            <path d="M96 36C108 36 117 44 114 53C111 60 100 57 96 50C92 43 89 36 96 36Z" fill="#222222" />
            <ellipse cx="58" cy="50" rx="9" ry="5" fill="#FFFFFF" stroke="#222222" stroke-width="2.5" transform="rotate(-20 58 50)" />
            <ellipse cx="122" cy="50" rx="9" ry="5" fill="#FFFFFF" stroke="#222222" stroke-width="2.5" transform="rotate(20 122 50)" />
            <path d="M74 53C76 50 80 50 82 53" stroke="#222222" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="M98 53C100 50 104 50 106 53" stroke="#222222" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <ellipse cx="90" cy="67" rx="16" ry="10" fill="#FFC6C7" stroke="#222222" stroke-width="2.5" />
            <ellipse cx="84" cy="65" rx="1.8" ry="2.5" fill="#555555" />
            <ellipse cx="96" cy="65" rx="1.8" ry="2.5" fill="#555555" />
          </svg>
          <div class="empty-state-title">参加しているリストがありません</div>
          <div class="empty-state-desc">新しいリストを作成するか、共有招待リンクから参加してください。</div>
          <button class="btn btn-primary" onclick="document.getElementById('create-list-dialog').showModal()">＋ 新しいリストを作成する</button>
        </div>
      </Layout>
    )
    return c.html(<EmptyListPage />)
  }
})

app.get('/lp', (c) => {
  return c.html(<LandingPage />)
})

app.get('/login', (c) => {
  if (c.get('user')) return c.redirect('/')
  return c.html(<LoginPage />)
})

app.get('/register', (c) => {
  if (c.get('user')) return c.redirect('/')
  return c.html(<RegisterPage />)
})

app.get('/lists/:listId', async (c) => {
  const user = c.get('user')
  if (!user) return c.redirect('/login')

  const listId = Number(c.req.param('listId'))
  
  const member = await c.env.DB.prepare(`
    SELECT lm.role 
    FROM list_members lm 
    JOIN shopping_lists sl ON lm.list_id = sl.id 
    WHERE lm.list_id = ? AND lm.user_id = ? AND sl.deleted_at IS NULL
  `).bind(listId, user.id).first<{role: string}>()
  
  if (!member) return c.redirect('/') // Or 404

  const listService = new ListService(c.env.DB)
  const lists = await listService.getUserLists(user.id)
  const currentList = await listService.getListById(listId)
  
  if (!currentList) return c.redirect('/')

  return c.html(<ShoppingListPage 
    user={user} 
    lists={lists} 
    currentList={currentList} 
    members={[]} 
    role={member.role as 'owner'|'member'} 
    cloudName={c.env.CLOUD_NAME} 
  />)
})

app.get('/join', (c) => {
  const user = c.get('user')
  if (!user) return c.redirect('/login') // User must be logged in to join

  const token = c.req.query('code')
  if (!token) return c.redirect('/')

  return c.html(<JoinPage token={token} />)
})

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/lists', listsRoutes)
app.route('/api/lists', membersRoutes)
app.route('/api/lists', invitesRoutes)
app.route('/api', inviteAcceptRoutes) // /api/invites/accept
app.route('/api/lists', itemsRoutes)
app.route('/api/lists', imagesRoutes)

export default app
