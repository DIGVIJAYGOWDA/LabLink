import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX2 } from 'lucide-react'

import { EmptyState, LoadError, PageHeader, StatusBadge } from '@/components/app/common'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoader, Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/services/api'
import { useLabStore } from '@/hooks/useLabStore'
import { formatDate, todayIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { slotLabel } from '@/services/labService'
import type { Booking } from '@/types/lab'

type Tab = 'upcoming' | 'pending' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Awaiting approval' },
  { id: 'history', label: 'Past & closed' },
]

export default function Bookings() {
  const { loading, error, role, currentUser, bookings, getResource, cancelBooking } = useLabStore()
  const notify = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [toCancel, setToCancel] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const today = todayIso()
  const isFaculty = role === 'faculty'

  const scoped = isFaculty ? bookings : bookings.filter((b) => b.studentName === currentUser)
  const byTab: Record<Tab, Booking[]> = {
    upcoming: scoped.filter((b) => b.status === 'confirmed' && b.date >= today),
    pending: scoped.filter((b) => b.status === 'pending' && b.date >= today),
    history: scoped.filter((b) => b.date < today || b.status === 'rejected' || b.status === 'cancelled'),
  }
  const rows = [...byTab[tab]].sort((a, b) =>
    tab === 'history' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date) || a.slotId.localeCompare(b.slotId),
  )

  async function confirmCancel() {
    if (!toCancel || cancelling) return
    setCancelling(true)
    try {
      await cancelBooking(toCancel.id)
      notify({ tone: 'success', title: toCancel.status === 'pending' ? 'Request withdrawn' : 'Booking cancelled' })
      setToCancel(null)
    } catch (err) {
      notify({ tone: 'error', title: 'Could not cancel', description: errorMessage(err) })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <PageHeader
        title={isFaculty ? 'All bookings' : 'My bookings'}
        description={isFaculty ? 'Every booking and request across departments.' : 'Your confirmed slots, access requests and history.'}
        actions={
          !isFaculty && (
            <Button asChild>
              <Link to="/app/catalogue">New booking</Link>
            </Button>
          )
        }
      />

      {loading ? (
        <PageLoader />
      ) : error ? (
        <LoadError />
      ) : (
        <>
          <div role="tablist" aria-label="Booking status" className="mb-4 flex gap-1 overflow-x-auto border-b">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="bookings-panel"
                onClick={() => setTab(t.id)}
                className={cn(
                  '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  tab === t.id ? 'border-brand text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{byTab[t.id].length}</span>
              </button>
            ))}
          </div>

          <div id="bookings-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {rows.length ? (
              <>
              <ul className="space-y-3 sm:hidden">
                {rows.map((b) => {
                  const r = getResource(b.resourceId)
                  return (
                    <li key={b.id} className="rounded-xl border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{r?.name}</p>
                          <p className="text-xs text-muted-foreground">{r?.lab}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="mt-3 text-sm">
                        {formatDate(b.date)} · <span className="tabular-nums">{slotLabel(b.slotId)}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isFaculty && `${b.studentName} · `}
                        {b.projectTitle} · deadline {formatDate(b.deadline)}
                      </p>
                      {b.facultyNote && b.status !== 'confirmed' && (
                        <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">{b.facultyNote}</p>
                      )}
                      {!isFaculty && tab !== 'history' && (
                        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setToCancel(b)}>
                          {b.status === 'pending' ? 'Withdraw request' : 'Cancel booking'}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
              <div className="hidden overflow-hidden rounded-xl border bg-background sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Resource</TableHead>
                      <TableHead>Date & slot</TableHead>
                      {isFaculty && <TableHead>Student</TableHead>}
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      {!isFaculty && tab !== 'history' && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((b) => {
                      const r = getResource(b.resourceId)
                      return (
                        <TableRow key={b.id}>
                          <TableCell>
                            <p className="font-medium">{r?.name}</p>
                            <p className="text-xs text-muted-foreground">{r?.lab}</p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <p>{formatDate(b.date)}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">{slotLabel(b.slotId)}</p>
                          </TableCell>
                          {isFaculty && <TableCell className="whitespace-nowrap">{b.studentName}</TableCell>}
                          <TableCell className="min-w-48">
                            <p>{b.projectTitle}</p>
                            <p className="text-xs text-muted-foreground">Deadline {formatDate(b.deadline)}</p>
                          </TableCell>
                          <TableCell className="min-w-40">
                            <StatusBadge status={b.status} />
                            {b.facultyNote && b.status !== 'confirmed' && (
                              <p className="mt-1 max-w-xs text-xs text-muted-foreground">{b.facultyNote}</p>
                            )}
                          </TableCell>
                          {!isFaculty && tab !== 'history' && (
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setToCancel(b)}>
                                {b.status === 'pending' ? 'Withdraw' : 'Cancel'}
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              </>
            ) : (
              <EmptyState
                icon={CalendarX2}
                title={tab === 'pending' ? 'No requests awaiting approval' : tab === 'upcoming' ? 'No upcoming bookings' : 'Nothing here yet'}
                description={tab === 'history' ? 'Past, declined and cancelled bookings will appear here.' : 'Book a slot from the resource catalogue.'}
                action={
                  !isFaculty && tab !== 'history' ? (
                    <Button asChild variant="outline">
                      <Link to="/app/catalogue">Browse catalogue</Link>
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>
        </>
      )}

      <Dialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        title={toCancel?.status === 'pending' ? 'Withdraw this request?' : 'Cancel this booking?'}
        description={
          toCancel
            ? `${getResource(toCancel.resourceId)?.name}, ${formatDate(toCancel.date)} · ${slotLabel(toCancel.slotId)}`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setToCancel(null)}>
              Keep it
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={confirmCancel} disabled={cancelling}>
              {cancelling && <Spinner className="size-4 text-current" label="Cancelling" />}
              {toCancel?.status === 'pending' ? 'Withdraw request' : 'Cancel booking'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">The slot will be released for other students.</p>
      </Dialog>
    </>
  )
}
