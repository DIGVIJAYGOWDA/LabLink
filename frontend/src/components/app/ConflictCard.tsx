import { useState } from 'react'
import { AlertTriangle, CalendarClock, Crown, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useLabStore } from '@/hooks/useLabStore'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { requestAllocationRecommendation, slotLabel } from '@/services/labService'
import type { AllocationRecommendation, Conflict } from '@/types/lab'

export default function ConflictCard({ conflict }: { conflict: Conflict }) {
  const { bookings, getResource, applyRecommendation } = useLabStore()
  const notify = useToast()
  const [rec, setRec] = useState<AllocationRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const resource = getResource(conflict.resourceId)

  async function recommend() {
    setLoading(true)
    setFailed(false)
    try {
      setRec(await requestAllocationRecommendation(conflict, bookings))
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  function apply() {
    if (!rec) return
    applyRecommendation(rec)
    notify({ tone: 'success', title: 'Conflict resolved', description: `${resource?.name ?? 'Resource'} allocation applied.` })
  }

  return (
    <Card className="border-amber-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
            {resource?.name ?? 'Resource'}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {formatDate(conflict.date)} · {slotLabel(conflict.slotId)}
          </p>
        </div>
        <Badge variant="warning">{conflict.bookings.length} competing requests</Badge>
      </div>

      <ul className="mt-4 space-y-2">
        {conflict.bookings.map((b) => {
          const winner = rec?.winnerId === b.id
          const move = rec?.reassignments.find((r) => r.bookingId === b.id)
          return (
            <li
              key={b.id}
              className={cn('rounded-lg border p-3 text-sm transition-colors', winner && 'border-brand bg-brand-soft')}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {b.studentName} <span className="font-normal text-muted-foreground">· {b.projectTitle}</span>
                </p>
                <span className="text-xs text-muted-foreground">Deadline {formatDate(b.deadline)}</span>
              </div>
              {winner && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand">
                  <Crown className="size-3.5" aria-hidden="true" /> Keeps this slot
                </p>
              )}
              {move && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Move to {formatDate(move.date)} · {slotLabel(move.slotId)}
                  {move.afterDeadline && <span className="ml-1 text-red-600">(after their deadline)</span>}
                </p>
              )}
              {rec?.unplacedIds.includes(b.id) && (
                <p className="mt-1.5 text-xs text-red-600">No free slot in the booking window. Consider declining.</p>
              )}
            </li>
          )
        })}
      </ul>

      {rec && (
        <p className="mt-4 flex gap-2 rounded-lg bg-muted p-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          {rec.reason}
        </p>
      )}
      {failed && <p className="mt-4 text-sm text-red-600">Recommendation unavailable. Please try again.</p>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {rec ? (
          <>
            <Button onClick={apply}>Apply recommendation</Button>
            <Button variant="outline" onClick={() => setRec(null)}>
              Dismiss
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={recommend} disabled={loading}>
            {loading ? <Spinner className="size-4" label="Generating recommendation" /> : <Sparkles />}
            Get AI recommendation
          </Button>
        )}
      </div>
    </Card>
  )
}
