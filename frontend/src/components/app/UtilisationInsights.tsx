import { Link } from 'react-router-dom'
import { Flame, Leaf } from 'lucide-react'

import type { UtilisationInsights as Insights } from '@/services/labService'
import type { Role } from '@/types/lab'

const linkClass = 'font-medium text-brand underline-offset-4 hover:underline'

/** Turns utilisation numbers into one action per role: spread demand away from busy equipment. */
export default function UtilisationInsights({ insights, role }: { insights: Insights; role: Role }) {
  const { busiest, idle } = insights
  if (!busiest && !idle.length) return null
  const isFaculty = role === 'faculty'

  return (
    <ul className="mt-5 space-y-3 border-t pt-4 text-sm" aria-label="Utilisation insights">
      {busiest && (
        <li className="flex gap-2.5">
          <Flame className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p>
            <span className="font-medium">Highest demand:</span>{' '}
            <Link to={`/app/catalogue?q=${encodeURIComponent(busiest.resource.name)}`} className={linkClass}>
              {busiest.resource.name}
            </Link>{' '}
            ({busiest.active} slot{busiest.active === 1 ? '' : 's'} this week, {busiest.percent}%).{' '}
            {isFaculty ? 'Consider extra lab hours or steering new requests to quieter equipment.' : 'Book early if you need it.'}
          </p>
        </li>
      )}
      {idle.length > 0 && (
        <li className="flex gap-2.5">
          <Leaf className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <p>
            <span className="font-medium">Free all week:</span>{' '}
            {idle.slice(0, 3).map((r, i) => (
              <span key={r.id}>
                {i > 0 && ', '}
                <Link to={`/app/catalogue?q=${encodeURIComponent(r.name)}`} className={linkClass}>
                  {r.name}
                </Link>
              </span>
            ))}
            {idle.length > 3 && ` and ${idle.length - 3} more`}.{' '}
            {isFaculty ? 'Promote these to raise utilisation.' : 'Instant slots available.'}
          </p>
        </li>
      )}
    </ul>
  )
}
