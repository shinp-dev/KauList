document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form')
  const registerForm = document.getElementById('register-form')
  const logoutBtn = document.getElementById('logout-btn')
  const itemForm = document.getElementById('item-form')
  const itemsList = document.getElementById('items-list')
  const appData = document.getElementById('app-data')
  
  // Dialogs
  const shareDialog = document.getElementById('share-dialog')
  const membersDialog = document.getElementById('members-dialog')
  const createListDialog = document.getElementById('create-list-dialog')
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const fd = new FormData(loginForm)
      const data = Object.fromEntries(fd.entries())
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const json = await res.json()
      if (json.success) {
        window.location.href = '/'
      } else {
        const err = document.getElementById('error-message')
        err.textContent = json.error
        err.style.display = 'block'
      }
    })
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const fd = new FormData(registerForm)
      const data = Object.fromEntries(fd.entries())
      if (data.password !== data.password_confirm) {
        const err = document.getElementById('error-message')
        err.textContent = 'パスワードが一致しません'
        err.style.display = 'block'
        return
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const json = await res.json()
      if (json.success) {
        window.location.href = '/'
      } else {
        const err = document.getElementById('error-message')
        err.textContent = json.error
        err.style.display = 'block'
      }
    })
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      window.location.href = '/login'
    })
  }

  // Create List UI
  const btnCreateList = document.getElementById('btn-create-list-dialog')
  const createListForm = document.getElementById('create-list-form')
  if (btnCreateList && createListDialog) {
    btnCreateList.addEventListener('click', () => {
      createListDialog.showModal()
    })
    document.getElementById('btn-close-create-list').addEventListener('click', () => {
      createListDialog.close()
    })
  }
  if (createListForm) {
    createListForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const name = document.getElementById('new-list-name').value
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const json = await res.json()
      if (json.success) {
        window.location.href = '/lists/' + json.list.id
      } else {
        alert(json.error)
      }
    })
  }

  const joinData = document.getElementById('join-data')
  if (joinData) {
    const token = joinData.dataset.token
    document.getElementById('btn-accept-invite').addEventListener('click', async () => {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const json = await res.json()
      if (json.success) {
        window.location.href = '/lists/' + json.listId
      } else {
        const err = document.getElementById('error-message')
        err.textContent = json.error
        err.style.display = 'block'
      }
    })
  }

  if (appData) {
    const listId = appData.dataset.listId
    const role = appData.dataset.role
    const cloudName = appData.dataset.cloudName
    
    const loadItems = async () => {
      if (listId === '0') return
      const res = await fetch(`/api/lists/${listId}/items`)
      const json = await res.json()
      if (json.success) {
        renderItems(json.items)
      }
    }

    const renderItems = (items) => {
      if (!itemsList) return
      const filter = document.querySelector('input[name="filter"]:checked').value
      itemsList.innerHTML = ''
      
      const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)
      
      for (const item of filtered) {
        const li = document.createElement('li')
        li.style.display = 'flex'
        li.style.gap = '1rem'
        li.style.padding = '1rem'
        li.style.border = '1px solid var(--border)'
        li.style.borderRadius = '8px'
        li.style.alignItems = 'center'
        li.style.opacity = item.bought ? '0.6' : '1'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = item.bought === 1
        checkbox.onchange = async () => {
          await fetch(`/api/lists/${listId}/items/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bought: checkbox.checked })
          })
          loadItems()
        }

        const details = document.createElement('div')
        details.style.flex = '1'
        const title = document.createElement('div')
        title.style.fontWeight = 'bold'
        title.style.textDecoration = item.bought ? 'line-through' : 'none'
        title.textContent = `${item.name} (${item.count}${item.unit})`
        
        details.appendChild(title)
        
        li.appendChild(checkbox)
        
        if (item.image_url) {
          const img = document.createElement('img')
          img.src = item.image_url.replace('/upload/', '/upload/w_100,h_100,c_fill/') // thumbnail
          img.style.width = '60px'
          img.style.height = '60px'
          img.style.objectFit = 'cover'
          img.style.borderRadius = '4px'
          li.appendChild(img)
        }

        li.appendChild(details)

        const delBtn = document.createElement('button')
        delBtn.textContent = '削除'
        delBtn.className = 'btn-danger'
        delBtn.onclick = async () => {
          if (confirm('削除しますか？')) {
            await fetch(`/api/lists/${listId}/items/${item.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
            loadItems()
          }
        }
        li.appendChild(delBtn)

        itemsList.appendChild(li)
      }
    }

    const radios = document.querySelectorAll('input[name="filter"]')
    radios.forEach(r => r.addEventListener('change', loadItems))

    if (itemForm) {
      itemForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const submitBtn = itemForm.querySelector('button[type="submit"]')
        submitBtn.disabled = true
        const progress = document.getElementById('upload-progress')
        
        const name = document.getElementById('item-name').value
        const count = parseInt(document.getElementById('item-count').value, 10)
        const unit = document.getElementById('item-unit').value
        const category = document.getElementById('item-category').value
        const fileInput = document.getElementById('item-image')
        const file = fileInput.files[0]
        
        let image_id = undefined
        
        if (file) {
          progress.style.display = 'block'
          
          try {
            // 1. Signature
            const sigRes = await fetch(`/api/lists/${listId}/images/signature`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            const sigJson = await sigRes.json()
            if (!sigJson.success) throw new Error(sigJson.error)
            
            // 2. Cloudinary Upload
            const formData = new FormData()
            formData.append('file', file)
            formData.append('api_key', sigJson.api_key)
            formData.append('timestamp', sigJson.timestamp)
            formData.append('signature', sigJson.signature)
            formData.append('folder', sigJson.folder)
            formData.append('public_id', sigJson.public_id.split('/')[2])
            
            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData
            })
            const uploadData = await uploadRes.json()
            if (uploadData.error) throw new Error(uploadData.error.message)
            
            // 3. Complete
            const compRes = await fetch(`/api/lists/${listId}/images/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ public_id: sigJson.public_id, version: uploadData.version, signature: uploadData.signature })
            })
            const compJson = await compRes.json()
            if (!compJson.success) throw new Error(compJson.error)
            
            image_id = compJson.image_id
          } catch (err) {
            alert('画像アップロードに失敗しました: ' + err.message)
            submitBtn.disabled = false
            progress.style.display = 'none'
            return
          }
        }
        
        // 4. Create Item
        await fetch(`/api/lists/${listId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, count, unit, category, image_id })
        })
        
        itemForm.reset()
        submitBtn.disabled = false
        if (progress) progress.style.display = 'none'
        loadItems()
      })
    }
    
    // Share Dialog
    const btnShare = document.getElementById('btn-share')
    if (btnShare && shareDialog) {
      btnShare.addEventListener('click', async () => {
        const res = await fetch(`/api/lists/${listId}/invites`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        const json = await res.json()
        if (json.success) {
          const url = `${window.location.origin}/join?code=${json.token}`
          document.getElementById('invite-url').value = url
          shareDialog.showModal()
        } else {
          alert(json.error)
        }
      })
      
      document.getElementById('btn-close-share').addEventListener('click', () => shareDialog.close())
      document.getElementById('btn-copy-invite').addEventListener('click', () => {
        const input = document.getElementById('invite-url')
        input.select()
        document.execCommand('copy')
        alert('コピーしました')
      })
    }

    // Members Dialog
    const btnMembers = document.getElementById('btn-members')
    if (btnMembers && membersDialog) {
      const loadMembers = async () => {
        const res = await fetch(`/api/lists/${listId}/members`)
        const json = await res.json()
        if (json.success) {
          const list = document.getElementById('members-list')
          list.innerHTML = ''
          for (const m of json.members) {
            const li = document.createElement('li')
            li.style.display = 'flex'
            li.style.justifyContent = 'space-between'
            li.style.alignItems = 'center'
            li.style.padding = '0.5rem'
            li.style.border = '1px solid var(--border)'
            li.style.borderRadius = '4px'
            
            const info = document.createElement('div')
            info.textContent = `${m.display_name} (@${m.login_id}) - ${m.role}`
            li.appendChild(info)
            
            if (m.role !== 'owner') {
              const delBtn = document.createElement('button')
              delBtn.textContent = '削除'
              delBtn.className = 'btn-danger'
              delBtn.onclick = async () => {
                if (confirm('削除しますか？')) {
                  await fetch(`/api/lists/${listId}/members/${m.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
                  loadMembers()
                }
              }
              li.appendChild(delBtn)
            }
            list.appendChild(li)
          }
        }
      }

      btnMembers.addEventListener('click', () => {
        loadMembers()
        membersDialog.showModal()
      })
      
      document.getElementById('btn-close-members').addEventListener('click', () => membersDialog.close())
    }

    // Rename List
    const btnRenameList = document.getElementById('btn-rename-list')
    if (btnRenameList) {
      btnRenameList.addEventListener('click', async () => {
        const newName = prompt('新しいリスト名を入力してください:')
        if (newName && newName.trim()) {
          const res = await fetch(`/api/lists/${listId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim() })
          })
          const json = await res.json()
          if (json.success) {
            window.location.reload()
          } else {
            alert(json.error)
          }
        }
      })
    }

    // Delete List
    const btnDeleteList = document.getElementById('btn-delete-list')
    if (btnDeleteList) {
      btnDeleteList.addEventListener('click', async () => {
        if (confirm('本当にこのリストを削除しますか？\n(※この操作は取り消せません)')) {
          const res = await fetch(`/api/lists/${listId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          })
          const json = await res.json()
          if (json.success) {
            window.location.href = '/'
          } else {
            alert(json.error)
          }
        }
      })
    }

    // Leave List
    const btnLeaveList = document.getElementById('btn-leave-list')
    if (btnLeaveList) {
      btnLeaveList.addEventListener('click', async () => {
        if (confirm('本当にこのリストから退出しますか？')) {
          const res = await fetch(`/api/lists/${listId}/leave`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          })
          const json = await res.json()
          if (json.success) {
            window.location.href = '/'
          } else {
            alert(json.error)
          }
        }
      })
    }

    // Initial load
    loadItems()
  }
})
