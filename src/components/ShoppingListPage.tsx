import { jsx } from 'hono/jsx'
import { Layout } from './Layout'
import { ShareIcon, MoreVerticalIcon, PencilIcon, UsersIcon, TrashIcon, PlusIcon, ImageIcon } from './CowAssets'

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

      {/* Natural List Header Area (NO large standalone card wrapper) */}
      <div class="list-header-section">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--color-text); margin: 0;">
            {props.currentList.name}
          </h1>
          <div class="list-meta-info">
            <span class={`badge ${props.role === 'owner' ? 'badge-owner' : 'badge-member'}`}>
              {props.role === 'owner' ? 'オーナー' : 'メンバー'}
            </span>
          </div>
        </div>

        {/* Action buttons: Primary Share + 3-dots Menu for secondary actions */}
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button id="btn-share" class="btn btn-primary">
            <ShareIcon size={16} />
            共有
          </button>

          {/* Dropdown Menu Wrapper for Secondary Actions */}
          <div class="dropdown-wrapper">
            <button id="btn-more-menu" class="btn btn-secondary btn-icon" title="操作メニュー">
              <MoreVerticalIcon size={18} />
            </button>
            <div id="more-menu-dropdown" class="dropdown-menu">
              {props.role === 'owner' ? (
                <>
                  <button id="btn-rename-list" class="dropdown-item">
                    <PencilIcon size={15} />
                    名前変更
                  </button>
                  <button id="btn-members" class="dropdown-item">
                    <UsersIcon size={15} />
                    メンバー管理
                  </button>
                  <div style="border-top: 1px solid var(--color-border); margin: 0.2rem 0;"></div>
                  <button id="btn-delete-list" class="dropdown-item danger">
                    <TrashIcon size={15} />
                    リスト削除
                  </button>
                </>
              ) : (
                <>
                  <button id="btn-members" class="dropdown-item">
                    <UsersIcon size={15} />
                    メンバー一覧
                  </button>
                  <div style="border-top: 1px solid var(--color-border); margin: 0.2rem 0;"></div>
                  <button id="btn-leave-list" class="dropdown-item danger">
                    <TrashIcon size={15} />
                    リストから退出
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Form Area */}
      <div class="surface-card">
        <h3 style="font-size: 1rem; margin-bottom: 0.85rem; color: var(--color-text);">
          商品を追加
        </h3>
        
        <form id="item-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
          {/* Row 1: Item Name (wide), Quantity, Unit */}
          <div style="display: grid; grid-template-columns: 1fr 100px 90px; gap: 0.65rem;" class="form-row-desktop">
            <div class="form-group">
              <label for="item-name" class="form-label">商品名</label>
              <input type="text" id="item-name" class="form-control" placeholder="例: 牛乳、食パン、常備薬" required maxlength={100} />
            </div>
            <div class="form-group">
              <label for="item-count" class="form-label">数量</label>
              <input type="number" id="item-count" class="form-control" value="1" min="1" required />
            </div>
            <div class="form-group">
              <label for="item-unit" class="form-label">単位</label>
              <input type="text" id="item-unit" class="form-control" value="個" placeholder="個" maxlength={20} required />
            </div>
          </div>

          {/* Row 2: Category, Image, Submit Button */}
          <div style="display: grid; grid-template-columns: 140px 1fr 110px; gap: 0.65rem; align-items: flex-end;" class="form-row-desktop">
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
              <input type="file" id="item-image" class="form-control" accept="image/*" style="padding: 0.45rem;" />
            </div>

            <div>
              <button type="submit" class="btn btn-primary" style="width: 100%; height: 38px;">
                <PlusIcon size={16} />
                追加
              </button>
            </div>
          </div>
        </form>

        <div id="upload-progress" class="alert-error" style="display: none; margin-top: 0.75rem; background: var(--color-primary-soft); color: var(--color-primary-dark); border-color: var(--color-primary);">
          画像をアップロード中...
        </div>
      </div>

      {/* Shopping List Area */}
      <div style="margin-top: 1.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <h3 style="font-size: 1rem; color: var(--color-text);">
            買い物一覧
          </h3>
          
          {/* Category Filter Chips (No Emojis) */}
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
          <h3 style="font-size: 1.05rem; margin: 0;">リストを共有</h3>
          <button id="btn-close-share" class="btn btn-ghost btn-sm" style="padding: 0.2rem 0.4rem;">✕</button>
        </div>
        <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
          以下の招待URLを共有相手に送信してください。（24時間有効）
        </p>
        <div class="form-group" style="margin-bottom: 1rem;">
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.05rem; margin: 0;">メンバー管理</h3>
          <button id="btn-close-members" class="btn btn-ghost btn-sm" style="padding: 0.2rem 0.4rem;">✕</button>
        </div>
        <div id="members-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
          {/* Members rendered by main.js */}
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button onclick="document.getElementById('members-dialog').close()" class="btn btn-secondary">閉じる</button>
        </div>
      </dialog>

    </Layout>
  )
}
