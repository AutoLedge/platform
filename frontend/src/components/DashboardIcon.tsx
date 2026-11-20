export type DashboardIconName =
  | 'reconciliation'
  | 'settings'
  | 'arrow'
  | 'alert'
  | 'check'
  | 'calendar'
  | 'search'

type DashboardIconProps = {
  name: DashboardIconName
  size?: number
}

const iconPaths: Record<DashboardIconName, React.ReactNode> = {
  reconciliation: <><path d="M20 7h-7a4 4 0 0 0-4 4v2" /><path d="m16 3 4 4-4 4" /><path d="M4 17h7a4 4 0 0 0 4-4v-2" /><path d="m8 21-4-4 4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4L7.7 15a8 8 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8H14l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.8Z" transform="translate(0 -1) scale(.95)" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
}

export default function DashboardIcon({ name, size = 20 }: DashboardIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}
