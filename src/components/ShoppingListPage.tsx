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
      
      {/* 危険なXSSを防ぐため、HTML内にユーザー入力を直接埋め込まないよう、アプリ設定は安全にエスケープするか、
          データ属性などで渡す。以前のスクリプトタグの手法は安全にエスケープされた状態で行うか、
          今回はHTMLエスケープを行いつつ dataset で渡す */}
      <div id="app-data" 
        data-list-id={props.currentList.id} 
        data-role={props.role}
        data-cloud-name={props.cloudName}
        data-user-id={props.user.id}
        style="display: none;"></div>

      <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
        <h1 style="margin: 0;">{props.currentList.name}</h1>
        <div style="display: flex; gap: 0.5rem;">
          {props.role === 'owner' ? (
            <>
              <button id="btn-rename-list">名前変更</button>
              <button id="btn-share" class="btn-primary">共有する</button>
              <button id="btn-members">メンバー管理</button>
              <button id="btn-delete-list" class="btn-danger">リスト削除</button>
            </>
          ) : (
            <button id="btn-leave-list" class="btn-danger">リストから退出</button>
          )}
        </div>
      </div>

      <div class="card">
        <h3>商品を追加</h3>
        <form id="item-form" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
          <div style="display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-width: 200px;">
            <label for="item-name">商品名</label>
            <input type="text" id="item-name" required maxlength={100} />
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.25rem; width: 100px;">
            <label for="item-count">数量</label>
            <input type="number" id="item-count" value="1" min="1" required />
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.25rem; width: 100px;">
            <label for="item-unit">単位</label>
            <input type="text" id="item-unit" value="個" maxlength={20} required />
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.25rem; width: 150px;">
            <label for="item-category">カテゴリ</label>
            <select id="item-category" required>
              <option value="food">食品</option>
              <option value="daily">日用品</option>
              <option value="medicine">薬・衛生用品</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="item-image">画像 (任意)</label>
            <input type="file" id="item-image" accept="image/*" />
          </div>
          <button type="submit" class="btn-primary" style="height: 38px;">追加</button>
        </form>
        <div id="upload-progress" style="display: none; margin-top: 1rem; color: var(--primary);">アップロード中...</div>
      </div>

      <div class="card">
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
          <label><input type="radio" name="filter" value="all" checked /> すべて</label>
          <label><input type="radio" name="filter" value="food" /> 食品</label>
          <label><input type="radio" name="filter" value="daily" /> 日用品</label>
          <label><input type="radio" name="filter" value="medicine" /> 薬・衛生用品</label>
          <label><input type="radio" name="filter" value="other" /> その他</label>
        </div>
        
        <ul id="items-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem;">
          {/* Items rendered by client side JS */}
        </ul>
      </div>

      <dialog id="share-dialog" style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 1.5rem; max-width: 400px; width: 100%;">
        <h3 style="margin-top: 0;">リストを共有</h3>
        <p style="color: var(--text-light); font-size: 0.875rem;">招待URLを生成して共有します。（24時間有効・1回のみ利用可能）</p>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <input type="text" id="invite-url" readonly style="flex: 1;" />
          <button id="btn-copy-invite" class="btn-primary">コピー</button>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button id="btn-close-share">閉じる</button>
        </div>
      </dialog>

      <dialog id="members-dialog" style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 1.5rem; max-width: 500px; width: 100%;">
        <h3 style="margin-top: 0;">メンバー管理</h3>
        <ul id="members-list" style="list-style: none; padding: 0; margin: 0; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
          {/* Members rendered by JS */}
        </ul>
        <div style="display: flex; justify-content: flex-end;">
          <button id="btn-close-members">閉じる</button>
        </div>
      </dialog>

    </Layout>
  )
}
