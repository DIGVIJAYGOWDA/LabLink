import { useEffect, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity as ActivityIcon,
  CalendarCheck,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react'

import AssistantChat from '@/components/app/AssistantChat'
import AppFooter from '@/components/layout/AppFooter'
import { Button } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'
import { LabStoreProvider } from '@/hooks/LabStoreProvider'
import { useLabStore } from '@/hooks/useLabStore'
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
    <Link to="/app" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="shine relative flex size-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-brand to-cyan-600 text-white shadow-md shadow-brand/30">
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

const ROLE_OPTIONS: { value: Role; label: string; icon: LucideIcon; active: string }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap, active: 'text-brand' },
  { value: 'faculty', label: 'Faculty', icon: ShieldCheck, active: 'text-indigo-700' },
]

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown }

function RoleSwitcher() {
  const { role, setRole } = useLabStore()

  function choose(next: Role, e: MouseEvent<HTMLButtonElement>) {
    if (next === role) return
    const doc = document as ViewTransitionDocument
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!doc.startViewTransition || reduceMotion) {
      setRole(next)
      return
    }
    // Circular reveal from the clicked button (CSS: role-reveal in index.css)
    const r = e.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--vt-x', `${r.left + r.width / 2}px`)
    document.documentElement.style.setProperty('--vt-y', `${r.top + r.height / 2}px`)
    doc.startViewTransition(() => flushSync(() => setRole(next)))
  }

  return (
    <div role="radiogroup" aria-label="View as" className="relative grid grid-cols-2 rounded-lg border border-white/25 bg-white/10 p-0.5 backdrop-blur">
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-md transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          role === 'faculty' && 'translate-x-full',
        )}
      />
      {ROLE_OPTIONS.map(({ value, label, icon: Icon, active }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={role === value}
          onClick={(e) => choose(value, e)}
          className={cn(
            'relative z-10 flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-300 sm:px-3 sm:text-sm',
            role === value ? active : 'text-white/80 hover:text-white',
          )}
        >
          <Icon className={cn('hidden size-4 transition-transform duration-500 sm:block', role === value && 'rotate-[360deg]')} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { currentUser, role } = useLabStore()
  const title = APP_NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? 'LabLink'

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[15rem_1fr]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div className="scroll-progress" aria-hidden="true" />
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
        <header className="app-header sticky top-0 z-40 flex h-16 items-center gap-3 px-4 text-white shadow-lg shadow-brand/20 sm:px-6">
          <div
            aria-hidden="true"
            className={cn(
              'app-header-faculty pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700',
              role === 'faculty' ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 text-white hover:bg-white/15 hover:text-white lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="app-mobile-nav"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </Button>
          <p key={title} className="flex-1 truncate text-lg font-semibold tracking-tight animate-in fade-in slide-in-from-left-2 duration-500">
            {title}
          </p>
          <span className="hidden items-center gap-2 text-sm text-white/90 md:flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold ring-1 ring-white/30">
              {currentUser.split(' ').map((w) => w[0]).join('')}
            </span>
            {currentUser}
          </span>
          <RoleSwitcher />
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-6 outline-none sm:px-6 sm:pt-8">
          <div key={`${role}:${pathname}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
        <AppFooter />
      </div>
      <AssistantChat key={role} />
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
