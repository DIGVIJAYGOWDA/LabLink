import { CalendarCheck, ClipboardCheck, LayoutDashboard, Search, type LucideIcon } from 'lucide-react'

export interface AppNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** Main app navigation, used by the sidebar and the page title. */
export const APP_NAV: AppNavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/catalogue', label: 'Catalogue', icon: Search },
  { to: '/app/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/app/approvals', label: 'Approvals', icon: ClipboardCheck },
]
