// Lightweight, dependency-free CSS charts (keeps the bundle small).
import { formatDate, formatShortDay } from '@/lib/date'
import type { UtilisationRow } from '@/services/labService'

export function UtilisationBars({ rows }: { rows: UtilisationRow[] }) {
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{r.label}</span>
            <span className="tabular-nums text-muted-foreground">{r.percent}%</span>
          </div>
          <div
            className="mt-1.5 h-2 rounded-full bg-muted"
            role="meter"
            aria-label={`${r.label} utilisation`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={r.percent}
          >
            <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${Math.min(r.percent, 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

interface DayCount {
  date: string
  confirmed: number
  pending: number
}

export function WeeklyBookingsChart({ days }: { days: DayCount[] }) {
  const max = Math.max(1, ...days.map((d) => d.confirmed + d.pending))
  const summary = days.map((d) => `${formatDate(d.date)}: ${d.confirmed} confirmed, ${d.pending} pending`).join('; ')

  return (
    <div>
      <div className="flex h-40 items-end gap-2 sm:gap-3" role="img" aria-label={`Bookings for the next 7 days. ${summary}`}>
        {days.map((d) => (
          <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${formatDate(d.date)}: ${d.confirmed} confirmed, ${d.pending} pending`}>
            <div className="flex flex-col overflow-hidden rounded-t-md">
              <div className="bg-amber-300 transition-[height] duration-500" style={{ height: `${(d.pending / max) * 9}rem` }} />
              <div className="bg-brand transition-[height] duration-500" style={{ height: `${(d.confirmed / max) * 9}rem` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.date} className="flex-1 text-center text-xs text-muted-foreground">
            {i === 0 ? 'Today' : formatShortDay(d.date)}
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-brand" /> Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-amber-300" /> Pending
        </span>
      </div>
    </div>
  )
}
