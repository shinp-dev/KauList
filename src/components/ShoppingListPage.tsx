import { jsx } from 'hono/jsx'
import { Layout } from './Layout'
import { ShareIcon, MoreVerticalIcon, PencilIcon, UsersIcon, TrashIcon, PlusIcon } from './CowAssets'

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

      {/* Natural 1-Row List Header Area */}
      <div class="list-header-section">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <h1 style="font-size: 1.25rem; font-weight: 800; color: var(--color-text); margin: 0;">
            {props.currentList.name}
          </h1>
          <span class={`badge ${props.role === 'owner' ? 'badge-owner' : 'badge-member'}`} style="font-size: 0.65rem; padding: 0.1rem 0.35rem;">
            {props.role === 'owner' ? 'オーナー' : 'メンバー'}
          </span>
        </div>

        {/* Action buttons: Primary Share + 3-dots Menu */}
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <button id="btn-share" class="btn btn-primary btn-sm">
            <ShareIcon size={14} />
            共有
          </button>

          {/* Dropdown Menu Wrapper for Secondary Actions */}
          <div class="dropdown-wrapper">
            <button id="btn-more-menu" class="btn btn-secondary btn-icon" title="操作メニュー" style="width: 30px; height: 30px; padding: 0.3rem;">
              <MoreVerticalIcon size={16} />
            </button>
            <div id="more-menu-dropdown" class="dropdown-menu">
              {props.role === 'owner' ? (
                <>
                  <button id="btn-rename-list" class="dropdown-item">
                    <PencilIcon size={14} />
                    名前変更
                  </button>
                  <button id="btn-members" class="dropdown-item">
                    <UsersIcon size={14} />
                    メンバー管理
                  </button>
                  <div style="border-top: 1px solid var(--color-border); margin: 0.2rem 0;"></div>
                  <button id="btn-delete-list" class="dropdown-item danger">
                    <TrashIcon size={14} />
                    リスト削除
                  </button>
                </>
              ) : (
                <>
                  <button id="btn-members" class="dropdown-item">
                    <UsersIcon size={14} />
                    メンバー一覧
                  </button>
                  <div style="border-top: 1px solid var(--color-border); margin: 0.2rem 0;"></div>
                  <button id="btn-leave-list" class="dropdown-item danger">
                    <TrashIcon size={14} />
                    リストから退出
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Form Area (Compressed Spacing & Quantity/Unit in same row) */}
      <div class="surface-card">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--color-text);">
          商品を追加
        </h3>
        
        <form id="item-form" style="display: flex; flex-direction: column; gap: 0.5rem;">
          {/* Item Name */}
          <div class="form-group">
            <label for="item-name" class="form-label">商品名</label>
            <input type="text" id="item-name" class="form-control" placeholder="例: 牛乳、食パン" required maxlength={100} />
          </div>

          {/* Quantity & Unit in the SAME compact row */}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <div class="form-group">
              <label for="item-count" class="form-label">数量</label>
              <input type="number" id="item-count" class="form-control" value="1" min="1" required />
            </div>
            <div class="form-group">
              <label for="item-unit" class="form-label">単位</label>
              <input type="text" id="item-unit" class="form-control" value="個" placeholder="個" maxlength={20} required />
            </div>
          </div>

          {/* Category, Image, Submit Button */}
          <div style="display: grid; grid-template-columns: 130px 1fr 100px; gap: 0.5rem; align-items: flex-end;" class="form-row-desktop">
            <div class="form-group">
              <label for="item-category" class="form-label">カテゴリ</label>
              <select id="item-category" class="form-control" required>
                <option value="food">食品</option>
                <option value="daily">日用品</option>
                <option value="medicine">薬・衛生用品</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div class="form-group">
              <label for="item-image" class="form-label">画像 (任意)</label>
              <input type="file" id="item-image" class="form-control" accept="image/*" style="padding: 0.4rem;" />
            </div>

            <div>
              <button type="submit" class="btn btn-primary" style="width: 100%; height: 35px; padding: 0.35rem 0.65rem;">
                <PlusIcon size={14} />
                追加
              </button>
            </div>
          </div>
        </form>

        <div id="upload-progress" class="alert-error" style="display: none; margin-top: 0.5rem; background: var(--color-primary-soft); color: var(--color-primary-dark); border-color: var(--color-primary);">
          画像をアップロード中...
        </div>
      </div>

      {/* Shopping List Area */}
      <div style="margin-top: 1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.35rem;">
          <h3 style="font-size: 0.95rem; color: var(--color-text);">
            買い物一覧
          </h3>
          
          {/* Category Filter Chips */}
          <div class="chip-group">
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="all" checked style="display: none;" />
              <span class="chip active">すべて</span>
            </label>
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="food" style="display: none;" />
              <span class="chip">食品</span>
            </label>
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="daily" style="display: none;" />
              <span class="chip">日用品</span>
            </label>
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="medicine" style="display: none;" />
              <span class="chip">薬・衛生</span>
            </label>
            <label style="cursor: pointer;">
              <input type="radio" name="filter" value="other" style="display: none;" />
              <span class="chip">その他</span>
            </label>
          </div>
        </div>
        
        {/* Dynamic Items List Container */}
        <div id="items-list" class="items-list">
          {/* Items rendered by main.js */}
        </div>
      </div>

      {/* Share Dialog */}
      <dialog id="share-dialog">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h3 style="font-size: 1rem; margin: 0;">リストを共有</h3>
          <button id="btn-close-share" class="btn btn-ghost btn-sm" style="padding: 0.15rem 0.35rem;">✕</button>
        </div>
        <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-bottom: 0.85rem;">
          以下の招待URLを共有相手に送信してください。（24時間有効）
        </p>
        <div class="form-group" style="margin-bottom: 0.85rem;">
          <input type="text" id="invite-url" readonly class="form-control" style="background: var(--color-background); font-weight: 600;" />
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button id="btn-copy-invite" class="btn btn-primary" style="width: 100%;">
            招待URLをコピー
          </button>
        </div>
      </dialog>

      {/* Members Dialog */}
      <dialog id="members-dialog">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
          <h3 style="font-size: 1rem; margin: 0;">メンバー管理</h3>
          <button id="btn-close-members" class="btn btn-ghost btn-sm" style="padding: 0.15rem 0.35rem;">✕</button>
        </div>
        <div id="members-list" style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem;">
          {/* Members rendered by main.js */}
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button onclick="document.getElementById('members-dialog').close()" class="btn btn-secondary">閉じる</button>
        </div>
      </dialog>

    </Layout>
  )
}
