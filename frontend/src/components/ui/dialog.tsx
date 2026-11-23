import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from './button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Modal built on the native <dialog> element: focus trapping, Escape and top-layer come for free. */
export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        'fixed inset-0 m-auto h-fit max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50',
        className,
      )}
    >
      {open && (
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4 border-b p-5">
            <div>
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="-mr-2 -mt-1">
              <X />
            </Button>
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
