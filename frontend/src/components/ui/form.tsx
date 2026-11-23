import * as React from 'react'

import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500'

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(fieldBase, 'h-9 py-1', className)} {...props} />
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldBase, 'min-h-20 py-2', className)} {...props} />
}

function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(fieldBase, 'h-9 py-1 pr-8', className)} {...props} />
}

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium', className)} {...props} />
}

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}

/** Label + control + hint/error. The control should set aria-describedby={`${id}-msg`}. */
function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {(error || hint) && (
        <p id={`${id}-msg`} className={cn('text-xs', error ? 'text-red-600' : 'text-muted-foreground')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export { Field, Input, Label, Select, Textarea }
