import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import AssistantChat from '@/components/app/AssistantChat'
import AppFooter from '@/components/layout/AppFooter'
import { APP_NAV } from '@/components/layout/nav'
import RoleSwitcher from '@/components/layout/RoleSwitcher'
import { Brand, SidebarNav } from '@/components/layout/SidebarNav'
import { Button } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'
import { LabStoreProvider } from '@/hooks/LabStoreProvider'
import { useLabStore } from '@/hooks/useLabStore'
import { cn } from '@/lib/utils'

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
