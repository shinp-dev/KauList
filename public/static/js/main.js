document.addEventListener('DOMContentLoaded', () => {
  async function fetchJson(url, options) {
    const response = await fetch(url, options)
    const json = await response.json().catch(() => ({}))
    if (!response.ok || !json.success) {
      throw new Error(json.error || `HTTP ${response.status}`)
    }
    return json
  }

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
      try {
        await fetchJson('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        window.location.href = '/'
      } catch (err) {
        const errEl = document.getElementById('error-message')
        errEl.textContent = err.message
        errEl.style.display = 'block'
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
      try {
        await fetchJson('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        window.location.href = '/'
      } catch (err) {
        const errEl = document.getElementById('error-message')
        errEl.textContent = err.message
        errEl.style.display = 'block'
      }
    })
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetchJson('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      } catch (err) {}
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
      try {
        const json = await fetchJson('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        })
        window.location.href = '/lists/' + json.list.id
      } catch (err) {
        alert(err.message)
      }
    })
  }

  const joinData = document.getElementById('join-data')
  if (joinData) {
    const token = joinData.dataset.token
    document.getElementById('btn-accept-invite').addEventListener('click', async () => {
      try {
        const json = await fetchJson('/api/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        window.location.href = '/lists/' + json.listId
      } catch (err) {
        const errEl = document.getElementById('error-message')
        errEl.textContent = err.message
        errEl.style.display = 'block'
      }
    })
  }

  if (appData) {
    const listId = appData.dataset.listId
    const role = appData.dataset.role
    const cloudName = appData.dataset.cloudName
    
    const loadItems = async () => {
      if (listId === '0') return
      try {
        const json = await fetchJson(`/api/lists/${listId}/items`)
        renderItems(json.items)
      } catch (err) {
        console.error(err)
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
          try {
            await fetchJson(`/api/lists/${listId}/items/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bought: checkbox.checked })
            })
            loadItems()
          } catch (err) {
            alert('更新に失敗しました: ' + err.message)
            checkbox.checked = !checkbox.checked
          }
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
            try {
              await fetchJson(`/api/lists/${listId}/items/${item.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
              loadItems()
            } catch (err) {
              alert('削除に失敗しました: ' + err.message)
            }
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
        let reservedImageId = undefined
        let completedImageId = undefined

        const cleanupTemporaryImage = async () => {
          const targetId = completedImageId || reservedImageId
          if (!targetId) return
          try {
            await fetchJson(`/api/lists/${listId}/images/${targetId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            })
          } catch (error) {
            console.error('Failed to cleanup temporary image', error)
          }
        }
        
        if (file) {
          progress.style.display = 'block'
          
          try {
            // 1. Signature
            const sigJson = await fetchJson(`/api/lists/${listId}/images/signature`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            reservedImageId = sigJson.image_id
            
            // 2. Cloudinary Upload
            const formData = new FormData()
            formData.append('file', file)
            formData.append('api_key', sigJson.api_key)
            formData.append('timestamp', sigJson.timestamp)
            formData.append('signature', sigJson.signature)
            formData.append('public_id', sigJson.public_id)
            
            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData
            })
            const uploadData = await uploadRes.json()
            if (uploadData.error) throw new Error(uploadData.error.message)
            
            // 3. Complete
            const compJson = await fetchJson(`/api/lists/${listId}/images/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ public_id: sigJson.public_id, version: uploadData.version, signature: uploadData.signature })
            })
            
            completedImageId = compJson.image_id
            image_id = completedImageId
          } catch (err) {
            alert('画像アップロードに失敗しました: ' + err.message)
            cleanupTemporaryImage()
            submitBtn.disabled = false
            progress.style.display = 'none'
            return
          }
        }
        
        // 4. Create Item
        try {
          await fetchJson(`/api/lists/${listId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, count, unit, category, image_id })
          })
          itemForm.reset()
          loadItems()
        } catch (err) {
          alert('商品の追加に失敗しました: ' + err.message)
          cleanupTemporaryImage()
        } finally {
          submitBtn.disabled = false
          if (progress) progress.style.display = 'none'
        }
      })
    }
    
    // Share Dialog
    const btnShare = document.getElementById('btn-share')
    if (btnShare && shareDialog) {
      btnShare.addEventListener('click', async () => {
        try {
          const json = await fetchJson(`/api/lists/${listId}/invites`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
          const url = `${window.location.origin}/join?code=${json.token}`
          document.getElementById('invite-url').value = url
          shareDialog.showModal()
        } catch (err) {
          alert(err.message)
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
        try {
          const json = await fetchJson(`/api/lists/${listId}/members`)
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
                  try {
                    await fetchJson(`/api/lists/${listId}/members/${m.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
                    loadMembers()
                  } catch (err) {
                    alert('削除に失敗しました: ' + err.message)
                  }
                }
              }
              li.appendChild(delBtn)
            }
            list.appendChild(li)
          }
        } catch (err) {
          console.error(err)
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
          try {
            await fetchJson(`/api/lists/${listId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newName.trim() })
            })
            window.location.reload()
          } catch (err) {
            alert(err.message)
          }
        }
      })
    }

    // Delete List
    const btnDeleteList = document.getElementById('btn-delete-list')
    if (btnDeleteList) {
      btnDeleteList.addEventListener('click', async () => {
        if (confirm('本当にこのリストを削除しますか？\n(※この操作は取り消せません)')) {
          try {
            await fetchJson(`/api/lists/${listId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            })
            window.location.href = '/'
          } catch (err) {
            alert(err.message)
          }
        }
      })
    }

    // Leave List
    const btnLeaveList = document.getElementById('btn-leave-list')
    if (btnLeaveList) {
      btnLeaveList.addEventListener('click', async () => {
        if (confirm('本当にこのリストから退出しますか？')) {
          try {
            await fetchJson(`/api/lists/${listId}/leave`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            })
            window.location.href = '/'
          } catch (err) {
            alert(err.message)
          }
        }
      })
    }

    // Initial load
    loadItems()
  }
})
