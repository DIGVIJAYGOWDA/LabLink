import { CalendarCheck, CalendarX, CheckCircle2, FileText, Sparkles, XCircle, type LucideIcon } from 'lucide-react'

import { formatRelativeTime } from '@/lib/date'
import type { Activity, ActivityKind } from '@/types/lab'

const ICONS: Record<ActivityKind, { icon: LucideIcon; className: string }> = {
  booking: { icon: CalendarCheck, className: 'bg-brand-soft text-brand' },
  request: { icon: FileText, className: 'bg-amber-50 text-amber-700' },
  approval: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  rejection: { icon: XCircle, className: 'bg-red-50 text-red-700' },
  cancellation: { icon: CalendarX, className: 'bg-muted text-muted-foreground' },
  allocation: { icon: Sparkles, className: 'bg-brand-soft text-brand' },
}

export default function ActivityFeed({ items }: { items: Activity[] }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>

  return (
    <ul className="space-y-4">
      {items.map((a) => {
        const { icon: Icon, className } = ICONS[a.kind]
        return (
          <li key={a.id} className="flex items-start gap-3">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${className}`}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{a.message}</p>
              <p className="text-xs text-muted-foreground">
                <time dateTime={a.at}>{formatRelativeTime(a.at)}</time>
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
