import { CalendarClock, CheckCircle2, Sparkles } from 'lucide-react'

// Static sample data for visual preview only. No backend is connected.
const RESOURCES = [
  { name: 'Oscilloscope', dept: 'Electronics', use: 82 },
  { name: 'Arduino dev kits', dept: 'Embedded', use: 54 },
  { name: 'GPU workstation', dept: 'Computer Science', use: 91 },
]

export default function DashboardPreview() {
  return (
    <div
      className="rounded-2xl border bg-card p-4 shadow-xl sm:p-5"
      role="img"
      aria-label="Preview of the LabLink dashboard showing sample equipment, a booking conflict and an AI recommendation"
    >
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </div>
        <span className="text-xs text-muted-foreground">Sample data</span>
      </div>

      <div className="mt-4 space-y-3" aria-hidden="true">
        {RESOURCES.map((r) => (
          <div key={r.name} className="rounded-lg border p-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.dept}</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{r.use}% booked</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand" style={{ width: `${r.use}%` }} />
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="flex items-center gap-2 font-medium">
            <CalendarClock className="size-4" /> Slot conflict: GPU workstation
          </p>
          <p className="mt-1 text-xs">Two projects requested the same Friday slot.</p>
        </div>

        <div className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-brand">
            <Sparkles className="size-4" /> AI recommendation
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-foreground">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand" />
            Earlier slot to the nearer deadline; offer the next free slot to the other team.
          </p>
        </div>
      </div>
    </div>
  )
}
