import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center">
      <Loader2 className={cn('size-5 animate-spin text-brand', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function PageLoader({ label = 'Loading lab data' }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Spinner className="size-7" label={label} />
      <span aria-hidden="true">{label}…</span>
    </div>
  )
}
