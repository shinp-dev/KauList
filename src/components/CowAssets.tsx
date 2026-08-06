import { jsx } from 'hono/jsx'

/**
 * Main character KauList logo using /assets/icon.png
 */
export const KauListBrandLogo = (props: { size?: number }) => {
  const s = props.size || 32
  return (
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <img 
        src="/assets/icon.png" 
        alt="KauList" 
        style={`width: ${s}px; height: ${s}px; border-radius: 8px; object-fit: cover;`} 
      />
      <span class="brand-font" style="font-size: 1.25rem; font-weight: 800; color: var(--color-text);">
        KauList
      </span>
    </div>
  )
}

/**
 * Main character illustration image tag
 */
export const MainCharacterImage = (props: { size?: number; class?: string; style?: string }) => {
  const s = props.size || 100
  return (
    <img 
      src="/assets/icon.png" 
      alt="KauList Mascot" 
      class={props.class}
      style={`width: ${s}px; height: ${s}px; border-radius: 16px; object-fit: cover; ${props.style || ''}`} 
    />
  )
}

/* Lucide SVG Icons (Zero Emojis) */

export const PlusIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

export const ShareIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)

export const UsersIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

export const PencilIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    <path d="m15 5 4 4"/>
  </svg>
)

export const TrashIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
)

export const ShoppingBasketIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m5 11 4-7M19 11l-4-7"/>
    <path d="M2 11h20l-2 9H4L2 11z"/>
    <circle cx="12" cy="15" r="1"/>
  </svg>
)

export const ImageIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
)

export const TagIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
    <circle cx="7" cy="7" r="2"/>
  </svg>
)

export const MoreVerticalIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="5" r="1"/>
    <circle cx="12" cy="19" r="1"/>
  </svg>
)

export const CheckIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export const XIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
)

export const LogOutIcon = (props: { size?: number; color?: string }) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
