import { jsx } from 'hono/jsx'

/**
 * KauList Cute Cow Logo Icon
 */
export const CowLogoIcon = (props: { size?: number; class?: string }) => {
  const s = props.size || 36
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class={props.class}>
      {/* Background soft circle */}
      <circle cx="24" cy="24" r="22" fill="#EEF3FF" />
      
      {/* Cow Horns */}
      <path d="M12 16C10 13 11 9 14 10C16 11 16 14 16 14" stroke="#D98A56" stroke-width="2.5" stroke-linecap="round" fill="#F4A261" />
      <path d="M36 16C38 13 37 9 34 10C32 11 32 14 32 14" stroke="#D98A56" stroke-width="2.5" stroke-linecap="round" fill="#F4A261" />
      
      {/* Cow Head Base */}
      <ellipse cx="24" cy="24" rx="14" ry="12" fill="#FFFFFF" stroke="#222222" stroke-width="2.5" />
      
      {/* Cow Ears */}
      <ellipse cx="9" cy="20" rx="4" ry="2.5" fill="#FFFFFF" stroke="#222222" stroke-width="2" transform="rotate(-20 9 20)" />
      <ellipse cx="39" cy="20" rx="4" ry="2.5" fill="#FFFFFF" stroke="#222222" stroke-width="2" transform="rotate(20 39 20)" />
      <ellipse cx="9" cy="20" rx="2.5" ry="1.5" fill="#FFB7B2" transform="rotate(-20 9 20)" />
      <ellipse cx="39" cy="20" rx="2.5" ry="1.5" fill="#FFB7B2" transform="rotate(20 39 20)" />

      {/* Cow Spot on Face */}
      <path d="M27 14C31 14 35 17 34 21C33 24 29 23 27 20C26 17 25 14 27 14Z" fill="#222222" />

      {/* Cow Eyes */}
      <circle cx="18" cy="21" r="2" fill="#222222" />
      <circle cx="30" cy="21" r="2" fill="#222222" />
      <circle cx="18.5" cy="20.5" r="0.7" fill="#FFFFFF" />
      <circle cx="30.5" cy="20.5" r="0.7" fill="#FFFFFF" />

      {/* Snout & Nose */}
      <ellipse cx="24" cy="28" rx="8.5" ry="5.5" fill="#FFC6C7" stroke="#222222" stroke-width="2" />
      <ellipse cx="21" cy="27.5" rx="1.2" ry="1.8" fill="#555555" />
      <ellipse cx="27" cy="27.5" rx="1.2" ry="1.8" fill="#555555" />
      <path d="M22.5 30.5C23.5 31.2 24.5 31.2 25.5 30.5" stroke="#222222" stroke-width="1.5" stroke-linecap="round" />

      {/* Small Shopping Bag Badge overlay */}
      <rect x="29" y="29" width="13" height="13" rx="3" fill="#4C6FFF" stroke="#FFFFFF" stroke-width="1.5" />
      <path d="M33 29V27C33 25.5 34 24.5 35.5 24.5C37 24.5 38 25.5 38 27V29" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" />
      <path d="M33 34H39" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" />
    </svg>
  )
}

/**
 * Hero Cow Mascot Illustration (Cow holding a shopping bag)
 */
export const HeroCowMascot = (props: { width?: number; height?: number }) => {
  const w = props.width || 280
  const h = props.height || 260
  return (
    <svg width={w} height={h} viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background Soft Glow */}
      <ellipse cx="140" cy="140" rx="120" ry="100" fill="#EEF3FF" />
      
      {/* Faint Cow Spots in Background */}
      <path d="M40 70C55 50 80 60 75 85C70 110 35 115 30 90C25 75 30 80 40 70Z" fill="rgba(34, 34, 34, 0.04)" />
      <path d="M210 180C230 160 250 180 245 200C240 220 205 225 200 200C195 185 200 190 210 180Z" fill="rgba(34, 34, 34, 0.04)" />

      {/* Cow Body */}
      <ellipse cx="140" cy="165" rx="55" ry="50" fill="#FFFFFF" stroke="#222222" stroke-width="3.5" />
      
      {/* Body Cow Spots */}
      <path d="M110 140C125 140 135 155 125 170C115 185 100 175 95 160C90 145 100 140 110 140Z" fill="#222222" />
      <path d="M165 170C180 170 188 182 178 195C168 208 152 198 155 185C158 172 155 170 165 170Z" fill="#222222" />

      {/* Horns */}
      <path d="M102 72C95 62 100 52 108 55C114 58 113 67 113 67" stroke="#D98A56" stroke-width="3.5" stroke-linecap="round" fill="#F4A261" />
      <path d="M178 72C185 62 180 52 172 55C166 58 167 67 167 67" stroke="#D98A56" stroke-width="3.5" stroke-linecap="round" fill="#F4A261" />

      {/* Head */}
      <ellipse cx="140" cy="95" rx="42" ry="34" fill="#FFFFFF" stroke="#222222" stroke-width="3.5" />
      
      {/* Head Cow Spot */}
      <path d="M148 64C165 64 178 75 174 88C170 98 155 94 148 84C143 74 138 64 148 64Z" fill="#222222" />

      {/* Ears */}
      <ellipse cx="95" cy="85" rx="12" ry="7" fill="#FFFFFF" stroke="#222222" stroke-width="3" transform="rotate(-25 95 85)" />
      <ellipse cx="185" cy="85" rx="12" ry="7" fill="#FFFFFF" stroke="#222222" stroke-width="3" transform="rotate(25 185 85)" />
      <ellipse cx="95" cy="85" rx="7" ry="4" fill="#FFB7B2" transform="rotate(-25 95 85)" />
      <ellipse cx="185" cy="85" rx="7" ry="4" fill="#FFB7B2" transform="rotate(25 185 85)" />

      {/* Eyes & Cheeks */}
      <circle cx="122" cy="88" r="5" fill="#222222" />
      <circle cx="158" cy="88" r="5" fill="#222222" />
      <circle cx="124" cy="86" r="1.8" fill="#FFFFFF" />
      <circle cx="160" cy="86" r="1.8" fill="#FFFFFF" />
      <ellipse cx="112" cy="97" rx="5" ry="3" fill="#FFB7B2" opacity="0.6" />
      <ellipse cx="168" cy="97" rx="5" ry="3" fill="#FFB7B2" opacity="0.6" />

      {/* Snout */}
      <ellipse cx="140" cy="108" rx="22" ry="14" fill="#FFC6C7" stroke="#222222" stroke-width="3" />
      <ellipse cx="132" cy="106" rx="2.5" ry="4" fill="#555555" />
      <ellipse cx="148" cy="106" rx="2.5" ry="4" fill="#555555" />
      <path d="M134 114C137 117 143 117 146 114" stroke="#222222" stroke-width="2.5" stroke-linecap="round" />

      {/* Left Arm holding Shopping Bag */}
      <path d="M100 150C85 160 70 175 65 190" stroke="#222222" stroke-width="7" stroke-linecap="round" />
      
      {/* Shopping Bag */}
      <rect x="42" y="175" width="42" height="48" rx="8" fill="#4C6FFF" stroke="#222222" stroke-width="3" />
      <path d="M54 175V164C54 158 59 154 63 154C67 154 72 158 72 164V175" stroke="#222222" stroke-width="3" stroke-linecap="round" fill="none" />
      {/* Bag Items Peek */}
      <circle cx="53" cy="170" r="6" fill="#34C759" />
      <rect x="63" y="166" width="10" height="10" rx="2" fill="#FF9500" />
      {/* Check mark on Bag */}
      <path d="M54 198L60 204L72 192" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

      {/* Right Arm waving */}
      <path d="M180 150C195 145 208 135 215 120" stroke="#222222" stroke-width="7" stroke-linecap="round" />
      <circle cx="217" cy="118" r="6" fill="#FFFFFF" stroke="#222222" stroke-width="3" />
    </svg>
  )
}

/**
 * Empty State Cow Mascot Illustration
 */
export const EmptyStateMascot = (props: { width?: number; height?: number }) => {
  const w = props.width || 180
  const h = props.height || 160
  return (
    <svg width={w} height={h} viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="90" cy="135" rx="70" ry="12" fill="#E7E3DF" opacity="0.6" />
      
      {/* Cow Body */}
      <ellipse cx="90" cy="110" rx="38" ry="32" fill="#FFFFFF" stroke="#222222" stroke-width="3" />
      <path d="M70 95C80 95 86 105 78 115C70 125 60 118 58 108C56 98 62 95 70 95Z" fill="#222222" />

      {/* Horns */}
      <path d="M64 42C59 34 63 26 69 28C74 30 73 37 73 37" stroke="#D98A56" stroke-width="2.5" stroke-linecap="round" fill="#F4A261" />
      <path d="M116 42C121 34 117 26 111 28C106 30 107 37 107 37" stroke="#D98A56" stroke-width="2.5" stroke-linecap="round" fill="#F4A261" />

      {/* Head looking down */}
      <ellipse cx="90" cy="58" rx="30" ry="24" fill="#FFFFFF" stroke="#222222" stroke-width="3" />
      <path d="M96 36C108 36 117 44 114 53C111 60 100 57 96 50C92 43 89 36 96 36Z" fill="#222222" />

      {/* Ears */}
      <ellipse cx="58" cy="50" rx="9" ry="5" fill="#FFFFFF" stroke="#222222" stroke-width="2.5" transform="rotate(-20 58 50)" />
      <ellipse cx="122" cy="50" rx="9" ry="5" fill="#FFFFFF" stroke="#222222" stroke-width="2.5" transform="rotate(20 122 50)" />

      {/* Cute Eyes (curved lines looking curious/sad) */}
      <path d="M74 53C76 50 80 50 82 53" stroke="#222222" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M98 53C100 50 104 50 106 53" stroke="#222222" stroke-width="2.5" stroke-linecap="round" fill="none" />

      {/* Snout */}
      <ellipse cx="90" cy="67" rx="16" ry="10" fill="#FFC6C7" stroke="#222222" stroke-width="2.5" />
      <ellipse cx="84" cy="65" rx="1.8" ry="2.5" fill="#555555" />
      <ellipse cx="96" cy="65" rx="1.8" ry="2.5" fill="#555555" />
      
      {/* Empty Bag on Ground */}
      <rect x="75" y="100" width="30" height="32" rx="6" fill="#F3EFEA" stroke="#222222" stroke-width="2.5" />
      <path d="M82 100V92C82 88 85 86 88 86C91 86 94 88 94 92V100" stroke="#222222" stroke-width="2.5" stroke-linecap="round" fill="none" />
      
      {/* Cute Question Marks / Sparks */}
      <path d="M125 75C125 70 130 68 132 72C133 74 130 76 130 79" stroke="#4C6FFF" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="130" cy="83" r="1" fill="#4C6FFF" />
    </svg>
  )
}
