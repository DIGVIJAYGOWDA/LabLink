import { Link, NavLink } from 'react-router-dom'
import { Activity as ActivityIcon, FlaskConical, Sparkles } from 'lucide-react'

import { useLabStore } from '@/hooks/useLabStore'
import { openAssistant } from '@/lib/assistant'
import { cn } from '@/lib/utils'
import { APP_NAV } from './nav'

export function Brand() {
  return (
    <Link to="/app" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="shine relative flex size-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-brand to-cyan-600 text-white shadow-md shadow-brand/30">
        <FlaskConical className="size-4.5" aria-hidden="true" />
      </span>
      LabLink
    </Link>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
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
      <div className="mt-auto rounded-xl bg-gradient-to-br from-brand to-cyan-700 p-4 text-white shadow-md shadow-brand/20">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4" aria-hidden="true" /> LabLink AI
        </p>
        <p className="mt-1 text-xs text-white/85">Ask which labs are free, or what your requests are waiting on.</p>
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            openAssistant()
          }}
          className="mt-3 w-full rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Ask a question
        </button>
      </div>
      <div className="mt-3 border-t pt-3">
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
