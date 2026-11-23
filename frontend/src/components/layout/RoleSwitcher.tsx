import type { MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { GraduationCap, ShieldCheck, type LucideIcon } from 'lucide-react'

import { useLabStore } from '@/hooks/useLabStore'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/lab'

const ROLE_OPTIONS: { value: Role; label: string; icon: LucideIcon; active: string }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap, active: 'text-brand' },
  { value: 'faculty', label: 'Faculty', icon: ShieldCheck, active: 'text-indigo-700' },
]

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown }

/** Student/Faculty toggle with a sliding pill and a circular view-transition reveal. */
export default function RoleSwitcher() {
  const { role, setRole } = useLabStore()

  function choose(next: Role, e: MouseEvent<HTMLButtonElement>) {
    if (next === role) return
    const doc = document as ViewTransitionDocument
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!doc.startViewTransition || reduceMotion) {
      setRole(next)
      return
    }
    // Circular reveal from the clicked button (CSS: role-reveal in index.css)
    const r = e.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--vt-x', `${r.left + r.width / 2}px`)
    document.documentElement.style.setProperty('--vt-y', `${r.top + r.height / 2}px`)
    doc.startViewTransition(() => flushSync(() => setRole(next)))
  }

  return (
    <div role="radiogroup" aria-label="View as" className="relative grid grid-cols-2 rounded-lg border border-white/25 bg-white/10 p-0.5 backdrop-blur">
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-md transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          role === 'faculty' && 'translate-x-full',
        )}
      />
      {ROLE_OPTIONS.map(({ value, label, icon: Icon, active }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={role === value}
          onClick={(e) => choose(value, e)}
          className={cn(
            'relative z-10 flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-300 sm:px-3 sm:text-sm',
            role === value ? active : 'text-white/80 hover:text-white',
          )}
        >
          <Icon className={cn('hidden size-4 transition-transform duration-500 sm:block', role === value && 'rotate-[360deg]')} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}
