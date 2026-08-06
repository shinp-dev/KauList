import { jsx } from 'hono/jsx'
import { Layout } from './Layout'

export const ShoppingListPage = (props: {
  user: any
  lists: any[]
  currentList: any
  members: any[]
  role: 'owner' | 'member'
  cloudName: string
}) => {
  return (
    <Layout title={props.currentList.name} user={props.user} lists={props.lists} currentListId={props.currentList.id}>
      
      {/* Dataset bridge to client-side JS */}
      <div id="app-data" 
        data-list-id={props.currentList.id} 
        data-role={props.role}
        data-cloud-name={props.cloudName}
        data-user-id={props.user.id}
        style="display: none;"></div>

      {/* List Header & Controls Card */}
      <div class="card card-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">📝</span>
          <h1 class="card-title" style="font-size: 1.4rem; margin: 0;">{props.currentList.name}</h1>
          <span class={`badge ${props.role === 'owner' ? 'badge-food' : 'badge-other'}`}>
            {props.role === 'owner' ? '👑 オーナー' : '👤 メンバー'}
          </span>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          {props.role === 'owner' ? (
            <>
              <button id="btn-rename-list" class="btn btn-secondary btn-sm">名前変更</button>
              <button id="btn-share" class="btn btn-primary btn-sm">🔗 共有する</button>
              <button id="btn-members" class="btn btn-secondary btn-sm">👥 メンバー管理</button>
              <button id="btn-delete-list" class="btn btn-danger btn-sm">削除</button>
            </>
          ) : (
            <>
              <button id="btn-share" class="btn btn-primary btn-sm">🔗 共有する</button>
              <button id="btn-members" class="btn btn-secondary btn-sm">👥 メンバー</button>
              <button id="btn-leave-list" class="btn btn-danger btn-sm">退出</button>
            </>
          )}
        </div>
      </div>

      {/* Add Item Form Card */}
      <div class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🛒</span> 買うものを追加
        </h3>
        
        <form id="item-form" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
            {/* Item Name */}
            <div class="form-group" style="grid-column: span 2;">
              <label for="item-name" class="form-label">商品名 <span style="color: var(--danger);">*</span></label>
              <input type="text" id="item-name" class="form-control" placeholder="例: 牛乳、食パン、常備薬" required maxlength={100} />
            </div>
            
            {/* Quantity */}
            <div class="form-group">
              <label for="item-count" class="form-label">数量 <span style="color: var(--danger);">*</span></label>
              <input type="number" id="item-count" class="form-control" value="1" min="1" required />
            </div>

            {/* Unit */}
            <div class="form-group">
              <label for="item-unit" class="form-label">単位 <span style="color: var(--danger);">*</span></label>
              <input type="text" id="item-unit" class="form-control" value="個" placeholder="個, 本, 袋, パック" maxlength={20} required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: flex-end;">
            {/* Category Selector */}
            <div class="form-group">
              <label for="item-category" class="form-label">カテゴリ</label>
              <select id="item-category" class="form-control" required>
                <option value="food">🍎 食品</option>
                <option value="daily">🧴 日用品</option>
                <option value="medicine">💊 薬・衛生用品</option>
                <option value="other">📦 その他</option>
              </select>
            </div>

            {/* Image File Selector */}
            <div class="form-group">
              <label for="item-image" class="form-label">商品画像 (任意)</label>
              <input type="file" id="item-image" class="form-control" accept="image/*" style="padding: 0.5rem;" />
            </div>

            {/* Submit Button */}
            <div>
              <button type="submit" class="btn btn-primary" style="width: 100%; height: 44px;">
                ＋ 追加する
              </button>
            </div>
          </div>
        </form>

        <div id="upload-progress" class="alert-error" style="display: none; margin-top: 1rem; background: var(--primary-light); color: var(--primary); border-color: rgba(76, 111, 255, 0.3);">
          ⏳ 画像をアップロード中...
        </div>
      </div>

      {/* Items Section Card */}
      <div class="card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
          <h3 style="font-size: 1.1rem; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>📋</span> 買い物リスト
          </h3>
          
          {/* Category Filter Chips */}
          <div class="chip-group">
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="all" checked style="display: none;" />
              <span class="chip active">すべて</span>
            </label>
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="food" style="display: none;" />
              <span class="chip">🍎 食品</span>
            </label>
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="daily" style="display: none;" />
              <span class="chip">🧴 日用品</span>
            </label>
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="medicine" style="display: none;" />
              <span class="chip">💊 薬・衛生</span>
            </label>
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="other" style="display: none;" />
              <span class="chip">📦 その他</span>
            </label>
          </div>
        </div>
        
        {/* Dynamic Items Container */}
        <div id="items-list" class="items-grid">
          {/* Items rendered by main.js */}
        </div>
      </div>

      {/* Share Dialog */}
      <dialog id="share-dialog">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.15rem; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>🔗</span> リストを共有
          </h3>
          <button id="btn-close-share" class="btn btn-ghost btn-sm" style="padding: 0.2rem 0.5rem; font-size: 1.1rem;">✕</button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.25rem;">
          以下の招待URLを家族やメンバーに送信してください。（24時間有効）
        </p>
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <input type="text" id="invite-url" readonly class="form-control" style="background: var(--bg-subtle); font-weight: 600;" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button id="btn-copy-invite" class="btn btn-primary" style="width: 100%;">
            📋 招待URLをコピー
          </button>
        </div>
      </dialog>

      {/* Members Dialog */}
      <dialog id="members-dialog">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1.15rem; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>👥</span> 参加メンバー
          </h3>
          <button id="btn-close-members" class="btn btn-ghost btn-sm" style="padding: 0.2rem 0.5rem; font-size: 1.1rem;">✕</button>
        </div>
        <div id="members-list" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
          {/* Members rendered by main.js */}
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button onclick="document.getElementById('members-dialog').close()" class="btn btn-secondary">閉じる</button>
        </div>
      </dialog>

    </Layout>
  )
}
