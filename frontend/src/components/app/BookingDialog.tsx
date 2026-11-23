import { useMemo, useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import { useLabStore } from '@/hooks/useLabStore'
import { addDays, formatDate, todayIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { BOOKING_WINDOW_DAYS, TIME_SLOTS, slotLabel, slotState } from '@/services/labService'
import type { LabResource, SlotId } from '@/types/lab'

const SLOT_START_HOUR: Record<SlotId, number> = { s1: 9, s2: 11, s3: 14, s4: 16 }

type Errors = Partial<Record<'date' | 'slotId' | 'projectTitle' | 'purpose' | 'deadline', string>>

export default function BookingDialog({ resource, onClose }: { resource: LabResource; onClose: () => void }) {
  const { bookings, createBooking, currentUser } = useLabStore()
  const notify = useToast()
  const today = todayIso()
  const lastDay = addDays(today, BOOKING_WINDOW_DAYS)

  const [date, setDate] = useState(today)
  const [slotId, setSlotId] = useState<SlotId | ''>('')
  const [projectTitle, setProjectTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [deadline, setDeadline] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  const slots = useMemo(
    () =>
      TIME_SLOTS.map((s) => {
        const past = date === today && new Date().getHours() >= SLOT_START_HOUR[s.id]
        const mine = bookings.some(
          (b) =>
            b.resourceId === resource.id && b.date === date && b.slotId === s.id && b.studentName === currentUser &&
            (b.status === 'pending' || b.status === 'confirmed'),
        )
        return { ...s, state: slotState(bookings, resource.id, date, s.id), past, mine }
      }),
    [bookings, resource.id, date, today, currentUser],
  )

  const selected = slots.find((s) => s.id === slotId)

  function validate(): Errors {
    const e: Errors = {}
    if (!date) e.date = 'Choose a date.'
    else if (date < today || date > lastDay) e.date = `Pick a date within the next ${BOOKING_WINDOW_DAYS} days.`
    if (!selected) e.slotId = 'Choose a time slot.'
    else if (selected.past) e.slotId = 'This slot has already started.'
    else if (selected.state === 'booked') e.slotId = 'This slot is already booked.'
    else if (selected.mine) e.slotId = 'You already have a booking or request for this slot.'
    if (projectTitle.trim().length < 3) e.projectTitle = 'Enter a project title (at least 3 characters).'
    if (resource.requiresApproval && purpose.trim().length < 10)
      e.purpose = 'Describe what you need the resource for (at least 10 characters).'
    if (!deadline) e.deadline = 'Enter the project deadline.'
    else if (deadline < today) e.deadline = 'The deadline cannot be in the past.'
    return e
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length || !slotId) return
    const booking = createBooking({
      resourceId: resource.id,
      date,
      slotId,
      projectTitle: projectTitle.trim(),
      purpose: purpose.trim(),
      deadline,
    })
    notify(
      booking.status === 'confirmed'
        ? { tone: 'success', title: 'Booking confirmed', description: `${resource.name}, ${formatDate(date)} · ${slotLabel(slotId)}` }
        : { tone: 'info', title: 'Request sent for approval', description: `Faculty will review your ${resource.name} request.` },
    )
    onClose()
  }

  const err = (k: keyof Errors) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `bk-${k}-msg` } : {})

  return (
    <Dialog
      open
      onClose={onClose}
      title={resource.requiresApproval ? 'Request access' : 'Book a slot'}
      description={`${resource.name} · ${resource.lab}, ${resource.department}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="booking-form">
            {resource.requiresApproval ? 'Submit request' : 'Confirm booking'}
          </Button>
        </>
      }
    >
      <form id="booking-form" noValidate onSubmit={onSubmit} className="space-y-5">
        {resource.requiresApproval && (
          <p className="flex gap-2 rounded-lg bg-brand-soft p-3 text-sm text-brand">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            This resource needs faculty approval. Your slot is held as a request until it is approved.
          </p>
        )}

        <Field id="bk-date" label="Date" error={errors.date}>
          <Input
            id="bk-date"
            type="date"
            min={today}
            max={lastDay}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setSlotId('')
            }}
            {...err('date')}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium">Time slot</legend>
          <div role="radiogroup" aria-describedby={errors.slotId ? 'bk-slotId-msg' : undefined} className="mt-1.5 grid grid-cols-2 gap-2">
            {slots.map((s) => {
              const disabled = s.past || s.state === 'booked' || s.mine
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={slotId === s.id}
                  disabled={disabled}
                  onClick={() => setSlotId(s.id)}
                  className={cn(
                    'flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    slotId === s.id ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'hover:border-brand/50 hover:bg-accent',
                  )}
                >
                  <span className="font-medium tabular-nums">{s.label}</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {s.mine ? 'Yours' : s.past ? 'Started' : s.state === 'booked' ? 'Booked' : s.state === 'requested' ? 'Requested by another team' : 'Free'}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.slotId && (
            <p id="bk-slotId-msg" className="mt-1.5 text-xs text-red-600">
              {errors.slotId}
            </p>
          )}
          {selected?.state === 'requested' && !selected.mine && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="warning">Conflict</Badge> Faculty will settle this using the AI allocation recommendation.
            </p>
          )}
        </fieldset>

        <Field id="bk-projectTitle" label="Project title" error={errors.projectTitle}>
          <Input
            id="bk-projectTitle"
            value={projectTitle}
            maxLength={80}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g. Line-following robot"
            {...err('projectTitle')}
          />
        </Field>

        <Field
          id="bk-purpose"
          label={resource.requiresApproval ? 'Requirements and purpose' : 'Requirements (optional)'}
          error={errors.purpose}
          hint={resource.requiresApproval ? 'Faculty use this to review your request.' : undefined}
        >
          <Textarea
            id="bk-purpose"
            value={purpose}
            maxLength={400}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="What will you use it for, and what do you need?"
            {...err('purpose')}
          />
        </Field>

        <Field id="bk-deadline" label="Project deadline" error={errors.deadline} hint="Used to prioritise fairly when slots conflict.">
          <Input id="bk-deadline" type="date" min={today} value={deadline} onChange={(e) => setDeadline(e.target.value)} {...err('deadline')} />
        </Field>
      </form>
    </Dialog>
  )
}
