import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLabStore } from '@/hooks/useLabStore'
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

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: string
  /** When set, the whole card links to the page with the details behind the number. */
  to?: string
}

export function StatCard({ icon: Icon, label, value, hint, to }: StatCardProps) {
  const card = (
    <Card
      className={
        to
          ? 'h-full p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-md sm:p-5'
          : 'h-full p-4 sm:p-5'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white sm:size-9">
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
