import { useState, type FormEvent } from 'react'
import { CheckCheck, ShieldCheck } from 'lucide-react'

import ConflictCard from '@/components/app/ConflictCard'
import { EmptyState, LoadError, PageHeader } from '@/components/app/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Textarea } from '@/components/ui/form'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useLabStore } from '@/hooks/useLabStore'
import { formatDate } from '@/lib/date'
import { slotLabel, slotState } from '@/services/labService'
import type { Booking } from '@/types/lab'

export default function Approvals() {
  const { loading, error, role, setRole, bookings, conflicts, getResource, approveBooking, rejectBooking } = useLabStore()
  const notify = useToast()
  const [declining, setDeclining] = useState<Booking | null>(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')

  if (role !== 'faculty') {
    return (
      <>
        <PageHeader title="Approvals" />
        <EmptyState
          icon={ShieldCheck}
          title="Faculty view only"
          description="Faculty review project-based access requests and resolve slot conflicts here."
          action={<Button onClick={() => setRole('faculty')}>Switch to faculty view</Button>}
        />
      </>
    )
  }

  const conflicted = new Set(conflicts.flatMap((c) => c.bookings.map((b) => b.id)))
  const pending = bookings
    .filter((b) => b.status === 'pending')
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || a.createdAt.localeCompare(b.createdAt))

  function approve(b: Booking) {
    approveBooking(b.id)
    notify({ tone: 'success', title: 'Request approved', description: `${b.studentName} · ${getResource(b.resourceId)?.name}` })
  }

  function openDecline(b: Booking) {
    setDeclining(b)
    setNote('')
    setNoteError('')
  }

  function submitDecline(e: FormEvent) {
    e.preventDefault()
    if (!declining) return
    if (note.trim().length < 5) {
      setNoteError('Give the student a short reason (at least 5 characters).')
      return
    }
    rejectBooking(declining.id, note.trim())
    notify({ tone: 'info', title: 'Request declined', description: `${declining.studentName} has been notified.` })
    setDeclining(null)
  }

  return (
    <>
      <PageHeader title="Approvals" description="Review project-based access requests and resolve slot conflicts fairly." />

      {loading ? (
        <PageLoader />
      ) : error ? (
        <LoadError />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="conflicts-h">
            <h2 id="conflicts-h" className="mb-3 flex items-center gap-2 text-lg font-semibold">
              Slot conflicts <Badge variant={conflicts.length ? 'warning' : 'default'}>{conflicts.length}</Badge>
            </h2>
            {conflicts.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {conflicts.map((c) => (
                  <ConflictCard key={c.key} conflict={c} />
                ))}
              </div>
            ) : (
              <EmptyState icon={CheckCheck} title="No conflicts" description="No two requests compete for the same slot right now." />
            )}
          </section>

          <section aria-labelledby="pending-h">
            <h2 id="pending-h" className="mb-3 flex items-center gap-2 text-lg font-semibold">
              Pending requests <Badge>{pending.length}</Badge>
            </h2>
            {pending.length ? (
              <div className="overflow-hidden rounded-xl border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Student & project</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Slot</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Decision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((b) => {
                      const taken = slotState(bookings, b.resourceId, b.date, b.slotId) === 'booked'
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="min-w-56">
                            <p className="font-medium">{b.studentName}</p>
                            <p className="text-sm">{b.projectTitle}</p>
                            {b.purpose && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{b.purpose}</p>}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{getResource(b.resourceId)?.name}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <p>{formatDate(b.date)}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">{slotLabel(b.slotId)}</p>
                            {conflicted.has(b.id) && (
                              <Badge variant="warning" className="mt-1">
                                Conflict
                              </Badge>
                            )}
                            {taken && (
                              <Badge variant="danger" className="mt-1">
                                Slot taken
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(b.deadline)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openDecline(b)}>
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                disabled={taken}
                                title={taken ? 'Another booking already holds this slot' : undefined}
                                onClick={() => approve(b)}
                              >
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState icon={CheckCheck} title="All caught up" description="There are no access requests waiting for review." />
            )}
          </section>
        </div>
      )}

      <Dialog
        open={!!declining}
        onClose={() => setDeclining(null)}
        title="Decline request"
        description={declining ? `${declining.studentName} · ${getResource(declining.resourceId)?.name}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeclining(null)}>
              Cancel
            </Button>
            <Button type="submit" form="decline-form">
              Decline request
            </Button>
          </>
        }
      >
        <form id="decline-form" noValidate onSubmit={submitDecline}>
          <Field id="decline-note" label="Reason for the student" error={noteError}>
            <Textarea
              id="decline-note"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={!!noteError}
              aria-describedby={noteError ? 'decline-note-msg' : undefined}
              placeholder="e.g. Please attach your lab safety clearance and resubmit."
            />
          </Field>
        </form>
      </Dialog>
    </>
  )
}
