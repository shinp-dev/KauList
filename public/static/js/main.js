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
  
  // Custom File Input UI Elements
  const fileInput = document.getElementById('item-image')
  const fileBtnText = document.getElementById('item-image-btn-text')
  const fileInfoBox = document.getElementById('item-image-info')
  const fileFileName = document.getElementById('item-image-filename')
  const filePreview = document.getElementById('item-image-preview')
  const btnClearImage = document.getElementById('btn-clear-image')

  // Unit Select Elements
  const unitSelect = document.getElementById('item-unit-select')
  const unitCustomInput = document.getElementById('item-unit-custom')

  if (unitSelect && unitCustomInput) {
    unitSelect.addEventListener('change', () => {
      if (unitSelect.value === 'other') {
        unitCustomInput.style.display = 'block'
        unitCustomInput.focus()
      } else {
        unitCustomInput.style.display = 'none'
        unitCustomInput.value = ''
      }
    })
  }

  const resetImageUI = () => {
    if (fileInput) fileInput.value = ''
    if (fileBtnText) fileBtnText.textContent = '画像を選ぶ'
    if (fileInfoBox) fileInfoBox.style.display = 'none'
    if (fileFileName) fileFileName.textContent = ''
    if (filePreview) {
      filePreview.style.display = 'none'
      filePreview.src = ''
    }
  }

  if (btnClearImage) {
    btnClearImage.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      resetImageUI()
    })
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0]
      if (file) {
        if (fileBtnText) fileBtnText.textContent = '画像を変更'
        if (fileInfoBox) fileInfoBox.style.display = 'flex'
        if (fileFileName) fileFileName.textContent = file.name
        
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (filePreview) {
              filePreview.src = e.target.result
              filePreview.style.display = 'block'
            }
          }
          reader.readAsDataURL(file)
        }
      } else {
        resetImageUI()
      }
    })
  }

  // Dialogs
  const shareDialog = document.getElementById('share-dialog')
  const membersDialog = document.getElementById('members-dialog')
  const createListDialog = document.getElementById('create-list-dialog')

  // 3-Dots Dropdown Menu Toggle
  const btnMoreMenu = document.getElementById('btn-more-menu')
  const moreMenuDropdown = document.getElementById('more-menu-dropdown')

  if (btnMoreMenu && moreMenuDropdown) {
    btnMoreMenu.addEventListener('click', (e) => {
      e.stopPropagation()
      moreMenuDropdown.classList.toggle('show')
    })

    document.addEventListener('click', (e) => {
      if (!moreMenuDropdown.contains(e.target) && e.target !== btnMoreMenu) {
        moreMenuDropdown.classList.remove('show')
      }
    })
  }

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
      food: { label: '食品' },
      daily: { label: '日用品' },
      medicine: { label: '薬・衛生用品' },
      other: { label: 'その他' }
    }

    const renderItems = (items) => {
      if (!itemsList) return
      const checkedRadio = document.querySelector('input[name="filter"]:checked')
      const filter = checkedRadio ? checkedRadio.value : 'all'
      itemsList.innerHTML = ''
      
      const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)

      if (filtered.length === 0) {
        const emptyDiv = document.createElement('div')
        emptyDiv.className = 'empty-state-container'
        emptyDiv.innerHTML = `
          <img src="/assets/icon.png" alt="KauList" class="empty-state-img" />
          <div class="empty-state-title">まだ買うものがありません</div>
          <div class="empty-state-desc">上のフォームから商品を追加しましょう</div>
        `
        itemsList.appendChild(emptyDiv)
        return
      }
      
      for (const item of filtered) {
        const itemDiv = document.createElement('div')
        itemDiv.className = `item-row ${item.bought ? 'bought' : ''}`

        // Custom Square Checkbox
        const checkboxLabel = document.createElement('label')
        checkboxLabel.className = `checkbox-custom ${item.bought ? 'checked' : ''}`
        checkboxLabel.innerHTML = `
          <input type="checkbox" ${item.bought ? 'checked' : ''} style="display: none;" />
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
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

        // Info
        const infoDiv = document.createElement('div')
        infoDiv.style.flex = '1'
        infoDiv.style.minWidth = '0'

        const titleDiv = document.createElement('div')
        titleDiv.className = 'item-name'
        titleDiv.style.fontWeight = '700'
        titleDiv.style.fontSize = '0.95rem'
        titleDiv.textContent = `${item.name} `
        
        const countSpan = document.createElement('span')
        countSpan.style.color = 'var(--color-primary-dark)'
        countSpan.style.fontWeight = '800'
        countSpan.style.fontSize = '0.875rem'
        countSpan.textContent = `(${item.count}${item.unit})`
        titleDiv.appendChild(countSpan)

        const catInfo = categoryMap[item.category] || categoryMap.other
        const catSpan = document.createElement('span')
        catSpan.className = 'cat-tag'
        catSpan.style.marginTop = '0.2rem'
        catSpan.textContent = catInfo.label

        infoDiv.appendChild(titleDiv)
        infoDiv.appendChild(catSpan)

        itemDiv.appendChild(checkboxLabel)

        // Image thumbnail
        if (item.image_url) {
          const img = document.createElement('img')
          img.src = item.image_url.replace('/upload/', '/upload/w_100,h_100,c_fill/')
          img.style.width = '44px'
          img.style.height = '44px'
          img.style.objectFit = 'cover'
          img.style.borderRadius = '8px'
          img.style.border = '1px solid var(--color-border)'
          img.style.cursor = 'pointer'
          img.onclick = () => window.open(item.image_url, '_blank')
          itemDiv.appendChild(img)
        }

        itemDiv.appendChild(infoDiv)

        // Delete button
        const delBtn = document.createElement('button')
        delBtn.className = 'btn btn-ghost btn-sm'
        delBtn.style.color = 'var(--color-danger)'
        delBtn.style.padding = '0.3rem 0.5rem'
        delBtn.setAttribute('aria-label', '商品を削除')
        delBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`
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

    // Filter Chips Radio Sync
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
        const submitBtn = document.getElementById('btn-submit-item') || itemForm.querySelector('button[type="submit"]')
        const btnSubmitText = document.getElementById('btn-submit-item-text')
        const progress = document.getElementById('upload-progress')

        // Disable button & show loading text
        if (submitBtn) submitBtn.disabled = true
        if (btnSubmitText) btnSubmitText.textContent = '追加中...'
        
        const name = document.getElementById('item-name').value
        const count = parseInt(document.getElementById('item-count').value, 10)
        
        // Extract Unit: if "other", use custom input text
        const unitSelectVal = unitSelect ? unitSelect.value : '個'
        const customUnitVal = unitCustomInput ? unitCustomInput.value : ''
        const unit = unitSelectVal === 'other' ? (customUnitVal.trim() || '個') : unitSelectVal
        
        const category = document.getElementById('item-category').value
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
            if (submitBtn) submitBtn.disabled = false
            if (btnSubmitText) btnSubmitText.textContent = '追加'
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
          document.getElementById('item-count').value = "1"
          if (unitSelect) unitSelect.value = "個"
          if (unitCustomInput) {
            unitCustomInput.style.display = "none"
            unitCustomInput.value = ""
          }
          resetImageUI()
          loadItems()
        } catch (err) {
          alert('商品の追加に失敗しました: ' + err.message)
          cleanupTemporaryImage()
        } finally {
          if (submitBtn) submitBtn.disabled = false
          if (btnSubmitText) btnSubmitText.textContent = '追加'
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
            copyBtn.textContent = 'コピーしました'
            setTimeout(() => { copyBtn.textContent = '招待URLをコピー' }, 2000)
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
            memberDiv.style.padding = '0.6rem 0.85rem'
            memberDiv.style.background = 'var(--color-background)'
            memberDiv.style.border = '1px solid var(--color-border)'
            memberDiv.style.borderRadius = 'var(--radius-sm)'
            
            const info = document.createElement('div')
            info.innerHTML = `
              <div style="font-weight: 700; font-size: 0.9rem; color: var(--color-text);">${m.display_name} <span style="font-weight: 400; color: var(--color-text-muted); font-size: 0.8rem;">(@${m.login_id})</span></div>
              <span class="badge ${m.role === 'owner' ? 'badge-owner' : 'badge-member'}">${m.role === 'owner' ? 'オーナー' : 'メンバー'}</span>
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
        if (moreMenuDropdown) moreMenuDropdown.classList.remove('show')
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
        if (moreMenuDropdown) moreMenuDropdown.classList.remove('show')
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
        if (moreMenuDropdown) moreMenuDropdown.classList.remove('show')
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
        if (moreMenuDropdown) moreMenuDropdown.classList.remove('show')
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
