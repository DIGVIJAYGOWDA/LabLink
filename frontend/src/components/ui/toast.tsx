import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'info' | 'error'

interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

type Notify = (toast: Omit<Toast, 'id'>) => void

const ToastContext = createContext<Notify | null>(null)

const ICONS = { success: CheckCircle2, info: Info, error: TriangleAlert }
const TONES = { success: 'text-emerald-600', info: 'text-brand', error: 'text-red-600' }

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const notify = useCallback<Notify>(
    (toast) => {
      const id = ++nextId
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-end gap-2 sm:left-auto">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone]
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-background p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2"
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', TONES[t.tone])} aria-hidden="true" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{t.title}</p>
                {t.description && <p className="mt-0.5 text-muted-foreground">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const notify = useContext(ToastContext)
  if (!notify) throw new Error('useToast must be used inside ToastProvider')
  return notify
}
