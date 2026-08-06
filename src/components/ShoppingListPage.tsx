import { jsx } from 'hono/jsx'
import { Layout } from './Layout'
import { ShareIcon, MoreVerticalIcon, PencilIcon, UsersIcon, TrashIcon, PlusIcon, ImageIcon, XIcon } from './CowAssets'
import type { ListQuota } from '../config/planLimits'

export const ShoppingListPage = (props: {
  user: any
  lists: any[]
  currentList: any
  members: any[]
  role: 'owner' | 'member'
  cloudName: string
  listQuota?: ListQuota
}) => {
  return (
    <Layout title={props.currentList.name} user={props.user} lists={props.lists} currentListId={props.currentList.id} listQuota={props.listQuota}>
      
      {/* Dataset bridge to client-side JS */}
      <div id="app-data" 
        data-list-id={props.currentList.id} 
        data-role={props.role}
        data-cloud-name={props.cloudName}
        data-user-id={props.user.id}
        style="display: none;"></div>

      {/* Natural 1-Row List Header Area */}
      <div class="list-header-section">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; min-width: 0;">
          <h1 style="font-size: 1.25rem; font-weight: 800; color: var(--color-text); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 280px;">
            {props.currentList.name}
          </h1>
          <span class={`badge ${props.role === 'owner' ? 'badge-owner' : 'badge-member'}`} style="font-size: 0.65rem; padding: 0.1rem 0.35rem; flex-shrink: 0;">
            {props.role === 'owner' ? 'オーナー' : 'メンバー'}
          </span>
        </div>

        {/* Action buttons: Primary Share + 3-dots Menu */}
        <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
          <button id="btn-share" class="btn btn-primary btn-sm" style="height: 32px;">
            <ShareIcon size={14} />
            共有
          </button>

          {/* Dropdown Menu Wrapper for Secondary Actions */}
          <div class="dropdown-wrapper">
            <button id="btn-more-menu" class="btn btn-secondary btn-icon" title="操作メニュー" aria-label="操作メニュー" style="width: 32px; height: 32px; padding: 0.3rem;">
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

      {/* Add Item Form Area */}
      <div class="surface-card">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--color-text);">
          商品を追加
        </h3>
        
        <form id="item-form" style="display: flex; flex-direction: column; gap: 0.5rem;">
          {/* Row 1: Item Name */}
          <div class="form-group">
            <label for="item-name" class="form-label">商品名</label>
            <input type="text" id="item-name" class="form-control" placeholder="例: 牛乳、食パン" required maxlength={100} />
          </div>

          {/* Row 2: Quantity & Unit (Select with Custom Option) in same row */}
          <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 0.5rem;">
            <div class="form-group">
              <label for="item-count" class="form-label">数量</label>
              <input type="number" id="item-count" class="form-control" value="1" min="1" required />
            </div>
            
            <div class="form-group">
              <label for="item-unit-select" class="form-label">単位</label>
              <select id="item-unit-select" class="form-control" required>
                <option value="個" selected>個</option>
                <option value="本">本</option>
                <option value="袋">袋</option>
                <option value="パック">パック</option>
                <option value="箱">箱</option>
                <option value="枚">枚</option>
                <option value="缶">缶</option>
                <option value="瓶">瓶</option>
                <option value="束">束</option>
                <option value="組">組</option>
                <option value="ケース">ケース</option>
                <option value="冊">冊</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="other">その他</option>
              </select>
              <input type="text" id="item-unit-custom" class="form-control" placeholder="単位を入力" maxlength={20} style="display: none; margin-top: 0.35rem;" />
            </div>
          </div>

          {/* Row 3: Category, Custom Image Upload Button, Submit Button */}
          <div style="display: grid; grid-template-columns: 120px 1fr 90px; gap: 0.5rem; align-items: flex-end;" class="form-row-desktop">
            <div class="form-group">
              <label for="item-category" class="form-label">カテゴリ</label>
              <select id="item-category" class="form-control" required>
                <option value="food">食品</option>
                <option value="daily">日用品</option>
                <option value="medicine">薬・衛生用品</option>
                <option value="other">その他</option>
              </select>
            </div>

            {/* Custom Image File Upload UI with Clear Button */}
            <div class="form-group" style="min-width: 0;">
              <label class="form-label">画像 (任意)</label>
              <div style="display: flex; align-items: center; gap: 0.4rem; height: 35px; min-width: 0;">
                <input type="file" id="item-image" accept="image/*" style="display: none;" />
                <label for="item-image" class="btn btn-secondary btn-sm" style="cursor: pointer; height: 35px; padding: 0.35rem 0.65rem; font-size: 0.8rem; flex-shrink: 0;">
                  <ImageIcon size={14} />
                  <span id="item-image-btn-text">画像を選ぶ</span>
                </label>
                
                {/* Visible ONLY when a file is selected */}
                <div id="item-image-info" style="display: none; align-items: center; gap: 0.35rem; font-size: 0.775rem; min-width: 0; flex: 1; overflow: hidden; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.2rem 0.4rem; height: 35px;">
                  <img id="item-image-preview" style="display: none; width: 24px; height: 24px; border-radius: 4px; object-fit: cover; flex-shrink: 0; border: 1px solid var(--color-border);" />
                  <span id="item-image-filename" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text); flex: 1;"></span>
                  <button type="button" id="btn-clear-image" class="btn btn-ghost btn-sm" title="画像を解除" style="padding: 0.1rem 0.25rem; height: 24px; width: 24px; flex-shrink: 0; color: var(--color-text-muted);">
                    <XIcon size={13} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button type="submit" id="btn-submit-item" class="btn btn-primary" style="width: 100%; height: 35px; padding: 0.35rem 0.65rem;">
                <PlusIcon size={14} />
                <span id="btn-submit-item-text">追加</span>
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
