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
    const closeBtn = document.getElementById('btn-close-create-list')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        createListDialog.close()
      })
    }
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
    const acceptBtn = document.getElementById('btn-accept-invite')
    if (acceptBtn) {
      acceptBtn.addEventListener('click', async () => {
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

    const categoryMap = {
      food: { label: '🍎 食品', class: 'badge-food' },
      daily: { label: '🧴 日用品', class: 'badge-daily' },
      medicine: { label: '💊 薬・衛生', class: 'badge-medicine' },
      other: { label: '📦 その他', class: 'badge-other' }
    }

    const renderItems = (items) => {
      if (!itemsList) return
      const checkedRadio = document.querySelector('input[name="filter"]:checked')
      const filter = checkedRadio ? checkedRadio.value : 'all'
      itemsList.innerHTML = ''
      
      const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)

      if (filtered.length === 0) {
        const emptyDiv = document.createElement('div')
        emptyDiv.className = 'empty-state'
        emptyDiv.innerHTML = `
          <svg width="140" height="130" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <rect x="75" y="100" width="30" height="32" rx="6" fill="#F3EFEA" stroke="#222222" stroke-width="2.5" />
            <path d="M82 100V92C82 88 85 86 88 86C91 86 94 88 94 92V100" stroke="#222222" stroke-width="2.5" stroke-linecap="round" fill="none" />
          </svg>
          <div class="empty-state-title">まだ買い物がありません</div>
          <div class="empty-state-desc">フォームから最初の商品を追加してみましょう！🐮</div>
        `
        itemsList.appendChild(emptyDiv)
        return
      }
      
      for (const item of filtered) {
        const itemDiv = document.createElement('div')
        itemDiv.className = `item-card ${item.bought ? 'bought' : ''}`

        // Custom Checkbox
        const checkboxLabel = document.createElement('label')
        checkboxLabel.className = `checkbox-custom ${item.bought ? 'checked' : ''}`
        checkboxLabel.innerHTML = `
          <input type="checkbox" ${item.bought ? 'checked' : ''} style="display: none;" />
          <svg viewBox="0 0 24 24"><path d="M20 6L9 17L4 12"/></svg>
        `
        
        checkboxLabel.querySelector('input').onchange = async (e) => {
          const checked = e.target.checked
          try {
            await fetchJson(`/api/lists/${listId}/items/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bought: checked })
            })
            loadItems()
          } catch (err) {
            alert('更新に失敗しました: ' + err.message)
          }
        }

        // Item info
        const infoDiv = document.createElement('div')
        infoDiv.style.flex = '1'
        infoDiv.style.minWidth = '0'

        const titleDiv = document.createElement('div')
        titleDiv.className = 'item-title'
        titleDiv.style.fontWeight = '700'
        titleDiv.style.fontSize = '1.05rem'
        titleDiv.style.color = 'var(--text-main)'
        titleDiv.style.textDecoration = item.bought ? 'line-through' : 'none'
        titleDiv.textContent = `${item.name} `
        
        const countSpan = document.createElement('span')
        countSpan.style.color = 'var(--primary)'
        countSpan.style.fontWeight = '800'
        countSpan.style.fontSize = '0.95rem'
        countSpan.textContent = ` (${item.count}${item.unit})`
        titleDiv.appendChild(countSpan)

        const catInfo = categoryMap[item.category] || categoryMap.other
        const badgeSpan = document.createElement('span')
        badgeSpan.className = `badge ${catInfo.class}`
        badgeSpan.style.marginTop = '0.25rem'
        badgeSpan.textContent = catInfo.label

        infoDiv.appendChild(titleDiv)
        infoDiv.appendChild(badgeSpan)

        itemDiv.appendChild(checkboxLabel)

        // Image thumbnail
        if (item.image_url) {
          const img = document.createElement('img')
          img.src = item.image_url.replace('/upload/', '/upload/w_120,h_120,c_fill/')
          img.style.width = '52px'
          img.style.height = '52px'
          img.style.objectFit = 'cover'
          img.style.borderRadius = '10px'
          img.style.border = '1px solid var(--border)'
          img.style.cursor = 'pointer'
          img.onclick = () => window.open(item.image_url, '_blank')
          itemDiv.appendChild(img)
        }

        itemDiv.appendChild(infoDiv)

        // Delete button
        const delBtn = document.createElement('button')
        delBtn.className = 'btn btn-danger btn-sm'
        delBtn.textContent = '削除'
        delBtn.onclick = async () => {
          if (confirm(`「${item.name}」を削除しますか？`)) {
            try {
              await fetchJson(`/api/lists/${listId}/items/${item.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
              loadItems()
            } catch (err) {
              alert('削除に失敗しました: ' + err.message)
            }
          }
        }
        itemDiv.appendChild(delBtn)

        itemsList.appendChild(itemDiv)
      }
    }

    // Handle filter chip radio change & update active styling
    const radios = document.querySelectorAll('input[name="filter"]')
    radios.forEach(r => {
      r.addEventListener('change', (e) => {
        document.querySelectorAll('.chip-group .chip').forEach(chip => chip.classList.remove('active'))
        if (e.target.nextElementSibling) {
          e.target.nextElementSibling.classList.add('active')
        }
        loadItems()
      })
    })

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
        const file = fileInput ? fileInput.files[0] : null
        
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
          if (progress) progress.style.display = 'block'
          
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
            if (progress) progress.style.display = 'none'
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
          // restore default values
          document.getElementById('item-count').value = "1"
          document.getElementById('item-unit').value = "個"
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
          const inviteInput = document.getElementById('invite-url')
          if (inviteInput) inviteInput.value = url
          shareDialog.showModal()
        } catch (err) {
          alert(err.message)
        }
      })
      
      const closeShareBtn = document.getElementById('btn-close-share')
      if (closeShareBtn) {
        closeShareBtn.addEventListener('click', () => shareDialog.close())
      }
      
      const copyBtn = document.getElementById('btn-copy-invite')
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const input = document.getElementById('invite-url')
          input.select()
          navigator.clipboard.writeText(input.value).then(() => {
            copyBtn.textContent = '✅ コピーしました！'
            setTimeout(() => { copyBtn.textContent = '📋 招待URLをコピー' }, 2000)
          }).catch(() => {
            document.execCommand('copy')
            alert('コピーしました')
          })
        })
      }
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
            const memberDiv = document.createElement('div')
            memberDiv.style.display = 'flex'
            memberDiv.style.justifyContent = 'space-between'
            memberDiv.style.alignItems = 'center'
            memberDiv.style.padding = '0.75rem 1rem'
            memberDiv.style.background = 'var(--bg-subtle)'
            memberDiv.style.border = '1px solid var(--border)'
            memberDiv.style.borderRadius = 'var(--radius-md)'
            
            const info = document.createElement('div')
            info.innerHTML = `
              <div style="font-weight: 700; color: var(--text-main);">${m.display_name} <span style="font-weight: 400; color: var(--text-muted); font-size: 0.85rem;">(@${m.login_id})</span></div>
              <span class="badge ${m.role === 'owner' ? 'badge-food' : 'badge-other'}">${m.role === 'owner' ? '👑 オーナー' : '👤 メンバー'}</span>
            `
            memberDiv.appendChild(info)
            
            if (m.role !== 'owner' && role === 'owner') {
              const delBtn = document.createElement('button')
              delBtn.textContent = '削除'
              delBtn.className = 'btn btn-danger btn-sm'
              delBtn.onclick = async () => {
                if (confirm(`「${m.display_name}」をメンバーから除外しますか？`)) {
                  try {
                    await fetchJson(`/api/lists/${listId}/members/${m.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
                    loadMembers()
                  } catch (err) {
                    alert('削除に失敗しました: ' + err.message)
                  }
                }
              }
              memberDiv.appendChild(delBtn)
            }
            list.appendChild(memberDiv)
          }
        } catch (err) {
          console.error(err)
        }
      }

      btnMembers.addEventListener('click', () => {
        loadMembers()
        membersDialog.showModal()
      })
      
      const closeMembersBtn = document.getElementById('btn-close-members')
      if (closeMembersBtn) {
        closeMembersBtn.addEventListener('click', () => membersDialog.close())
      }
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
