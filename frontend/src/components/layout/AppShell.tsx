import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity as ActivityIcon,
  CalendarCheck,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'
import { LabStoreProvider, useLabStore } from '@/hooks/useLabStore'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/lab'

interface AppNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const APP_NAV: AppNavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/catalogue', label: 'Catalogue', icon: Search },
  { to: '/app/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/app/approvals', label: 'Approvals', icon: ClipboardCheck },
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
        <FlaskConical className="size-4.5" aria-hidden="true" />
      </span>
      LabLink
    </Link>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { role, bookings, conflicts } = useLabStore()
  const pending = bookings.filter((b) => b.status === 'pending').length

  return (
    <nav aria-label="App" className="flex flex-1 flex-col gap-1">
      {APP_NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-brand-soft text-brand' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          <Icon className="size-4.5" aria-hidden="true" />
          <span className="flex-1">{label}</span>
          {to === '/app/approvals' && role === 'faculty' && pending > 0 && (
            <span
              className={cn(
                'rounded-full px-1.5 text-xs font-semibold',
                conflicts.length ? 'bg-amber-100 text-amber-900' : 'bg-muted text-foreground',
              )}
              aria-label={`${pending} pending`}
            >
              {pending}
            </span>
          )}
        </NavLink>
      ))}
      <div className="mt-auto border-t pt-3">
        <NavLink
          to="/status"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ActivityIcon className="size-4.5" aria-hidden="true" />
          Backend status
        </NavLink>
      </div>
    </nav>
  )
}

function RoleSwitcher() {
  const { role, setRole } = useLabStore()
  const options: { value: Role; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
  ]
  return (
    <div role="radiogroup" aria-label="View as" className="flex items-center rounded-lg border bg-muted/50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={role === o.value}
          onClick={() => setRole(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
            role === o.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { currentUser } = useLabStore()
  const title = APP_NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? 'LabLink'

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r bg-background p-4 lg:flex">
        <Brand />
        <SidebarNav />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside
            id="app-mobile-nav"
            className="absolute inset-y-0 left-0 flex w-64 flex-col gap-6 border-r bg-background p-4 shadow-xl animate-in slide-in-from-left"
          >
            <div className="flex items-center justify-between">
              <Brand />
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <X />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="app-mobile-nav"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </Button>
          <p className="flex-1 truncate font-semibold">{title}</p>
          <span className="hidden text-sm text-muted-foreground md:inline">{currentUser}</span>
          <RoleSwitcher />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function AppShell() {
  return (
    <LabStoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </LabStoreProvider>
  )
}
