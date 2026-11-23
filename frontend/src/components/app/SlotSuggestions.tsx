import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/date'
import { BOOKING_WINDOW_DAYS, slotLabel, type SlotSuggestion } from '@/services/labService'

interface SlotSuggestionsProps {
  suggestions: SlotSuggestion[]
  /** The chosen slot already has another team's request (vs. the whole day being taken). */
  contested: boolean
  onPick: (slot: SlotSuggestion) => void
}

/** Soonest completely free slots, offered when the chosen slot is contested or the day is full. */
export default function SlotSuggestions({ suggestions, contested, onPick }: SlotSuggestionsProps) {
  const heading = suggestions.length
    ? contested
      ? 'Skip the queue: these slots are completely free'
      : 'No free slots on this day. The soonest free slots are'
    : `No completely free slots in the next ${BOOKING_WINDOW_DAYS} days.`

  return (
    <div className="mt-3 rounded-lg border border-dashed p-3" aria-live="polite">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <Sparkles className="size-3.5 text-brand" aria-hidden="true" />
        {heading}
      </p>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Button key={`${s.date}-${s.slotId}`} type="button" variant="outline" size="sm" onClick={() => onPick(s)}>
              {formatDate(s.date)} · {slotLabel(s.slotId)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
