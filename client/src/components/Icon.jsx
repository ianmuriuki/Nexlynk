const ICONS = {
  alert: (c) => <><path d="M12 3.5l9.5 16.5H2.5L12 3.5z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17.5" r=".6" fill={c}/></>,
  'alert-circle': (c) => <><circle cx="12" cy="12" r="9"/><path d="M12 7.8v5"/><circle cx="12" cy="16.2" r=".6" fill={c}/></>,
  'arrow-left': () => <path d="M19 12H5M11 6l-6 6 6 6"/>,
  'arrow-right': () => <path d="M5 12h14M13 6l6 6-6 6"/>,
  'bar-chart': () => <path d="M18 20V10M12 20V4M6 20v-6"/>,
  bell: () => <><path d="M6 8a6 6 0 1112 0c0 4 1.6 5.2 2.2 6H3.8C4.4 13.2 6 12 6 8z"/><path d="M10 19a2 2 0 004 0"/></>,
  briefcase: () => <><rect x="3" y="7.5" width="18" height="13" rx="2.4"/><path d="M8.5 7.5V6a2 2 0 012-2h3a2 2 0 012 2v1.5M3 13h18"/></>,
  building: () => <><rect x="5" y="3.5" width="14" height="17" rx="1.6"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 20.5v-4h4v4"/></>,
  check: () => <path d="M5 12.5l4.5 4.5L19 7"/>,
  'check-circle': () => <><circle cx="12" cy="12" r="9"/><path d="M8.5 12l2.5 2.5 4.5-5"/></>,
  'chevron-down': () => <path d="M6 9l6 6 6-6"/>,
  'chevron-left': () => <path d="M15 6l-6 6 6 6"/>,
  'chevron-right': () => <path d="M9 6l6 6-6 6"/>,
  clock: () => <><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></>,
  dashboard: () => <><rect x="3" y="3" width="8" height="10" rx="1.6"/><rect x="3" y="16" width="8" height="5" rx="1.6"/><rect x="13" y="3" width="8" height="5" rx="1.6"/><rect x="13" y="11" width="8" height="10" rx="1.6"/></>,
  edit: () => <path d="M16.5 4.5l3 3L8 19l-4 1 1-4L16.5 4.5z"/>,
  external: () => <path d="M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>,
  eye: () => <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  file: () => <><path d="M7 3h7l5 5v13H7V3z"/><path d="M14 3v5h5M9.5 13h6M9.5 16.5h6"/></>,
  filter: () => <path d="M4 5h16l-6.4 8v5l-3.2 1.6V13L4 5z"/>,
  'graduation-cap': () => <><path d="M21.42 10.922a1 1 0 00-.019-1.838L12.83 5.18a2 2 0 00-1.66 0L2.6 9.08a1 1 0 000 1.832l8.57 3.908a2 2 0 001.66 0z"/><path d="M22 10v6M6 12.5V16a6 3 0 0012 0v-3.5"/></>,
  info: (c) => <><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".6" fill={c}/></>,
  logout: () => <path d="M15 4h3.5a1.5 1.5 0 011.5 1.5v13a1.5 1.5 0 01-1.5 1.5H15M10 16l-4-4 4-4M6 12h11"/>,
  mail: () => <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></>,
  'map-pin': () => <><path d="M20 10.5c0 6.5-8 12-8 12s-8-5.5-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10.5" r="3"/></>,
  menu: () => <path d="M4 6h16M4 12h16M4 18h16"/>,
  plus: () => <path d="M12 5v14M5 12h14"/>,
  search: () => <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.4-3.4"/></>,
  settings: () => <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  shield: () => <path d="M12 21.5s7.5-3.8 7.5-9.5V5.4L12 2.5 4.5 5.4V12c0 5.7 7.5 9.5 7.5 9.5z"/>,
  'trending-up': () => <><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></>,
  upload: () => <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></>,
  user: () => <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></>,
  users: () => <><circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.4 2.7-5.5 6-5.5s6 2.1 6 5.5"/><path d="M16 5.2a3.4 3.4 0 010 6.3M17.5 14.6c2.4.6 4 2.3 4 5"/></>,
  x: () => <path d="M6 6l12 12M18 6L6 18"/>,
  'x-circle': () => <><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></>,
  zap: () => <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>,
}

export default function Icon({ name, size = 20, color = 'currentColor', sw = 1.7, style, className }) {
  const draw = ICONS[name]
  if (!draw) {
    if (import.meta.env.DEV) console.warn(`Icon "${name}" does not exist`)
    return null
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {draw(color)}
    </svg>
  )
}
