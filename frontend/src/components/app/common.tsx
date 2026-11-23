import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Boxes, Cpu, Monitor, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLabStore } from '@/hooks/useLabStore'
import type { BookingStatus, ResourceType } from '@/types/lab'

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

export function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
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

export const RESOURCE_TYPE: Record<ResourceType, { label: string; icon: LucideIcon }> = {
  equipment: { label: 'Equipment', icon: Cpu },
  kit: { label: 'Development kit', icon: Boxes },
  workstation: { label: 'Workstation', icon: Monitor },
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
