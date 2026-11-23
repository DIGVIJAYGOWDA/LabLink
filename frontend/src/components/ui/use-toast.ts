import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'info' | 'error'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

export type Notify = (toast: Omit<Toast, 'id'>) => void

export const ToastContext = createContext<Notify | null>(null)

/** Shows a toast notification. Must be used inside ToastProvider. */
export function useToast() {
  const notify = useContext(ToastContext)
  if (!notify) throw new Error('useToast must be used inside ToastProvider')
  return notify
}
