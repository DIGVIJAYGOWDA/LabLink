import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { CURRENT_FACULTY, CURRENT_STUDENT } from '@/data/mockLab'
import { fetchLabData, findConflicts, slotLabel } from '@/services/labService'
import { formatDate } from '@/lib/date'
import type {
  Activity,
  ActivityKind,
  AllocationRecommendation,
  Booking,
  Conflict,
  LabResource,
  NewBookingInput,
  Role,
} from '@/types/lab'

// App state for the core features. Mutations are applied locally for now; when backend
// endpoints exist, call them from these actions (see services/labService.ts).

interface LabStore {
  loading: boolean
  error: string | null
  reload: () => void
  role: Role
  setRole: (role: Role) => void
  currentUser: string
  resources: LabResource[]
  bookings: Booking[]
  activities: Activity[]
  conflicts: Conflict[]
  getResource: (id: string) => LabResource | undefined
  createBooking: (input: NewBookingInput) => Booking
  cancelBooking: (id: string) => void
  approveBooking: (id: string, note?: string) => void
  rejectBooking: (id: string, note: string) => void
  applyRecommendation: (rec: AllocationRecommendation) => void
}

const LabStoreContext = createContext<LabStore | null>(null)

let idCounter = 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++idCounter}`

export function LabStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('student')
  const [resources, setResources] = useState<LabResource[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchLabData()
      .then((data) => {
        setResources(data.resources)
        setBookings(data.bookings)
        setActivities(data.activities)
      })
      .catch(() => setError('Could not load lab data. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const getResource = useCallback((id: string) => resources.find((r) => r.id === id), [resources])
  const resourceName = useCallback((id: string) => getResource(id)?.name ?? 'a resource', [getResource])

  const log = useCallback((kind: ActivityKind, message: string) => {
    setActivities((prev) => [{ id: newId('a'), kind, message, at: new Date().toISOString() }, ...prev])
  }, [])

  const createBooking = useCallback(
    (input: NewBookingInput) => {
      const resource = getResource(input.resourceId)
      const booking: Booking = {
        ...input,
        id: newId('b'),
        studentName: CURRENT_STUDENT,
        status: resource?.requiresApproval ? 'pending' : 'confirmed',
        createdAt: new Date().toISOString(),
      }
      setBookings((prev) => [booking, ...prev])
      log(
        booking.status === 'pending' ? 'request' : 'booking',
        `${CURRENT_STUDENT} ${booking.status === 'pending' ? 'requested' : 'booked'} the ${resource?.name ?? 'resource'}`,
      )
      return booking
    },
    [getResource, log],
  )

  const updateBooking = useCallback((id: string, patch: Partial<Booking>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }, [])

  const cancelBooking = useCallback(
    (id: string) => {
      const b = bookings.find((x) => x.id === id)
      updateBooking(id, { status: 'cancelled' })
      if (b) log('cancellation', `${b.studentName} cancelled the ${resourceName(b.resourceId)} booking`)
    },
    [bookings, updateBooking, log, resourceName],
  )

  const approveBooking = useCallback(
    (id: string, note?: string) => {
      const b = bookings.find((x) => x.id === id)
      updateBooking(id, { status: 'confirmed', facultyNote: note || 'Approved.' })
      if (b) log('approval', `${CURRENT_FACULTY} approved ${b.studentName} on the ${resourceName(b.resourceId)}`)
    },
    [bookings, updateBooking, log, resourceName],
  )

  const rejectBooking = useCallback(
    (id: string, note: string) => {
      const b = bookings.find((x) => x.id === id)
      updateBooking(id, { status: 'rejected', facultyNote: note })
      if (b) log('rejection', `${CURRENT_FACULTY} declined ${b.studentName}'s ${resourceName(b.resourceId)} request`)
    },
    [bookings, updateBooking, log, resourceName],
  )

  const applyRecommendation = useCallback(
    (rec: AllocationRecommendation) => {
      const winner = bookings.find((b) => b.id === rec.winnerId)
      setBookings((prev) =>
        prev.map((b): Booking => {
          if (b.id === rec.winnerId) return { ...b, status: 'confirmed', facultyNote: 'Approved using the AI allocation recommendation.' }
          const move = rec.reassignments.find((r) => r.bookingId === b.id)
          if (move) {
            return {
              ...b,
              date: move.date,
              slotId: move.slotId,
              facultyNote: `Moved to ${formatDate(move.date)}, ${slotLabel(move.slotId)} to resolve a slot conflict. Awaiting approval.`,
            }
          }
          return b
        }),
      )
      if (winner) log('allocation', `Conflict on the ${resourceName(winner.resourceId)} resolved with an AI recommendation`)
    },
    [bookings, log, resourceName],
  )

  const conflicts = useMemo(() => findConflicts(bookings), [bookings])

  const value = useMemo<LabStore>(
    () => ({
      loading,
      error,
      reload: load,
      role,
      setRole,
      currentUser: role === 'student' ? CURRENT_STUDENT : CURRENT_FACULTY,
      resources,
      bookings,
      activities,
      conflicts,
      getResource,
      createBooking,
      cancelBooking,
      approveBooking,
      rejectBooking,
      applyRecommendation,
    }),
    [
      loading, error, load, role, resources, bookings, activities, conflicts, getResource,
      createBooking, cancelBooking, approveBooking, rejectBooking, applyRecommendation,
    ],
  )

  return <LabStoreContext.Provider value={value}>{children}</LabStoreContext.Provider>
}

export function useLabStore() {
  const ctx = useContext(LabStoreContext)
  if (!ctx) throw new Error('useLabStore must be used inside LabStoreProvider')
  return ctx
}
