import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { getCookie } from 'hono/cookie'
import type { Bindings, Variables } from './types'
import { authRoutes } from './modules/auth/routes'
import { listsRoutes } from './modules/lists/routes'
import { membersRoutes } from './modules/members/routes'
import { invitesRoutes, globalInvitesRoutes } from './modules/invites/routes'
import { itemsRoutes } from './modules/items/routes'
import { imagesRoutes } from './modules/images/routes'
import { ImageService } from './modules/images/service'
import { ListService } from './modules/lists/service'

// Components
import { LoginPage, RegisterPage } from './components/AuthPages'
import { ShoppingListPage } from './components/ShoppingListPage'
import { JoinPage } from './components/JoinPage'

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
  if (!user) return c.redirect('/login')

  const listService = new ListService(c.env.DB)
  const lists = await listService.getUserLists(user.id)
  
  if (lists.length > 0) {
    return c.redirect(`/lists/${lists[0].id}`)
  } else {
    // If user has no lists (e.g. left all lists)
    return c.html(<ShoppingListPage user={user} lists={[]} currentList={{id: 0, name: 'リストがありません'}} members={[]} role="member" cloudName={c.env.CLOUD_NAME} />)
  }
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
  const member = await c.env.DB.prepare('SELECT role FROM list_members WHERE list_id = ? AND user_id = ?').bind(listId, user.id).first<{role: string}>()
  if (!member) return c.redirect('/') // Or 404

  const listService = new ListService(c.env.DB)
  const lists = await listService.getUserLists(user.id)
  const currentList = await c.env.DB.prepare('SELECT * FROM shopping_lists WHERE id = ?').bind(listId).first()

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
app.route('/api', globalInvitesRoutes) // /api/invites/accept
app.route('/api/lists', itemsRoutes)
app.route('/api/lists', imagesRoutes)

export default app
