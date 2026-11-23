import { MapPin, ShieldCheck, Wrench, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { LabResource } from '@/types/lab'
import { RESOURCE_TYPE } from './common'

interface ResourceCardProps {
  resource: LabResource
  utilisation: number
  canBook: boolean
  onBook: () => void
}

export default function ResourceCard({ resource, utilisation, canBook, onBook }: ResourceCardProps) {
  const { icon: Icon, label } = RESOURCE_TYPE[resource.type]
  const unavailable = resource.status === 'maintenance'

  return (
    <Card className="group flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold">{resource.name}</h3>
          <p className="text-xs text-muted-foreground">
            {label} · {resource.department}
          </p>
        </div>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" aria-hidden="true" /> {resource.lab}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {unavailable ? (
          <Badge variant="danger">
            <Wrench className="size-3" aria-hidden="true" /> Under maintenance
          </Badge>
        ) : resource.requiresApproval ? (
          <Badge variant="warning">
            <ShieldCheck className="size-3" aria-hidden="true" /> Faculty approval
          </Badge>
        ) : (
          <Badge variant="success">
            <Zap className="size-3" aria-hidden="true" /> Instant booking
          </Badge>
        )}
      </div>

      {!unavailable && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Booked this week</span>
            <span className="tabular-nums">{utilisation}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-brand" style={{ width: `${utilisation}%` }} />
          </div>
        </div>
      )}

      <Button
        className="mt-5 w-full"
        variant={resource.requiresApproval ? 'outline' : 'default'}
        disabled={unavailable || !canBook}
        onClick={onBook}
        title={!canBook ? 'Switch to the student view to book' : undefined}
      >
        {unavailable ? 'Unavailable' : resource.requiresApproval ? 'Request access' : 'Book a slot'}
      </Button>
    </Card>
  )
}
