import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLabStore } from '@/hooks/useLabStore'
import { parseIsoDate } from '@/lib/date'
import type { BookingStatus } from '@/types/lab'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

const TONES = {
  teal: { chip: 'bg-brand-soft text-brand group-hover:bg-brand group-hover:text-white', bar: 'from-brand to-cyan-500' },
  sky: { chip: 'bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white', bar: 'from-sky-500 to-indigo-500' },
  amber: { chip: 'bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white', bar: 'from-amber-400 to-orange-500' },
  rose: { chip: 'bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white', bar: 'from-rose-500 to-pink-500' },
} as const

interface StatCardProps {
  tone?: keyof typeof TONES
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: string
  /** When set, the whole card links to the page with the details behind the number. */
  to?: string
}

export function StatCard({ tone = 'teal', icon: Icon, label, value, hint, to }: StatCardProps) {
  const colors = TONES[tone]
  const card = (
    <Card
      className={
        to
          ? 'relative h-full overflow-hidden p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md sm:p-5'
          : 'relative h-full overflow-hidden p-4 sm:p-5'
      }
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors.bar}`} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors sm:size-9 ${colors.chip}`}>
          <Icon className="size-4 sm:size-4.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums sm:mt-3 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {to && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-brand">
          View details <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </p>
      )}
    </Card>
  )
  if (!to) return card
  return (
    <Link to={to} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${label}: ${value}. View details`}>
      {card}
    </Link>
  )
}

/** Calendar-style date chip: weekday, day number and month. */
export function DateTile({ iso }: { iso: string }) {
  const d = parseIsoDate(iso)
  return (
    <span className="flex w-12 shrink-0 flex-col items-center rounded-lg border bg-brand-soft/60 py-1 text-brand" aria-hidden="true">
      <span className="text-[0.625rem] font-semibold uppercase tracking-wide">{d.toLocaleDateString(undefined, { month: 'short' })}</span>
      <span className="text-lg font-bold leading-none tabular-nums">{d.getDate()}</span>
      <span className="text-[0.625rem] text-foreground/70">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
    </span>
  )
}

const STATUS: Record<BookingStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'outline' }> = {
  confirmed: { label: 'Confirmed', variant: 'success' },
  pending: { label: 'Awaiting approval', variant: 'warning' },
  rejected: { label: 'Declined', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS[status]
  return <Badge variant={s.variant}>{s.label}</Badge>
}


export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-background px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Shows the store's load error with a retry; renders nothing otherwise. */
export function LoadError() {
  const { error, reload } = useLabStore()
  if (!error) return null
  return (
    <EmptyState
      icon={TriangleAlert}
      title="Lab data unavailable"
      description={error}
      action={<Button onClick={reload}>Try again</Button>}
    />
  )
}
