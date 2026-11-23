import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { CURRENT_FACULTY, CURRENT_STUDENT } from '@/data/demoUsers'
import { ApiError, errorMessage } from '@/services/api'
import * as labApi from '@/services/labService'
import { findConflicts } from '@/services/labService'
import type { Activity, Booking, LabResource, NewBookingInput, Role } from '@/types/lab'
import { LabStoreContext, type LabStore } from './useLabStore'

// App state for the core features, loaded from and saved to the backend API (services/labService.ts).
// Actions return the saved booking or throw an ApiError the caller shows to the user.



const ROLE_KEY = 'lablink.role'

function initialRole(): Role {
  try {
    return localStorage.getItem(ROLE_KEY) === 'faculty' ? 'faculty' : 'student'
  } catch {
    return 'student'
  }
}

export function LabStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRoleState] = useState<Role>(initialRole)
  const [resources, setResources] = useState<LabResource[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  const fetchAll = useCallback(
    () =>
      labApi
        .fetchLabData()
        .then((data) => {
          setResources(data.resources)
          setBookings(data.bookings)
          setActivities(data.activities)
        })
        .catch((err) => setError(errorMessage(err, 'Could not load lab data. Please try again.')))
        .finally(() => setLoading(false)),
    [],
  )

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    void fetchAll()
  }, [fetchAll])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const setRole = useCallback((next: Role) => {
    setRoleState(next)
    try {
      localStorage.setItem(ROLE_KEY, next)
    } catch {
      // storage unavailable: role still changes for this visit
    }
  }, [])

  const merge = useCallback((updated: Booking[]) => {
    setBookings((prev) => {
      const byId = new Map(updated.map((b) => [b.id, b]))
      const replaced = prev.map((b) => byId.get(b.id) ?? b)
      const added = updated.filter((b) => !prev.some((p) => p.id === b.id))
      return [...added, ...replaced]
    })
  }, [])

  const refreshActivity = useCallback(() => {
    labApi.fetchActivity().then(setActivities).catch(() => undefined)
  }, [])

  /** Runs a mutation; on a 409 the local data is stale, so bookings are reloaded. */
  const run = useCallback(
    async <T,>(action: () => Promise<T>, onSuccess: (result: T) => void): Promise<T> => {
      try {
        const result = await action()
        onSuccess(result)
        refreshActivity()
        return result
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) labApi.fetchBookings().then(setBookings).catch(() => undefined)
        throw err
      }
    },
    [refreshActivity],
  )

  const createBooking = useCallback(
    (input: NewBookingInput) =>
      run(() => labApi.createBooking({ ...input, studentName: CURRENT_STUDENT }), (b) => merge([b])),
    [run, merge],
  )
  const cancelBooking = useCallback((id: string) => run(() => labApi.cancelBooking(id), (b) => merge([b])), [run, merge])
  const approveBooking = useCallback(
    (id: string, note?: string) => run(() => labApi.approveBooking(id, note), (b) => merge([b])),
    [run, merge],
  )
  const rejectBooking = useCallback(
    (id: string, note: string) => run(() => labApi.rejectBooking(id, note), (b) => merge([b])),
    [run, merge],
  )
  const resolveConflict = useCallback(
    async (conflictId: string) => {
      await run(() => labApi.resolveConflict(conflictId), (res) => merge(res.bookings))
    },
    [run, merge],
  )

  const getResource = useCallback((id: string) => resources.find((r) => r.id === id), [resources])
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
      resolveConflict,
    }),
    [
      loading, error, load, role, setRole, resources, bookings, activities, conflicts, getResource,
      createBooking, cancelBooking, approveBooking, rejectBooking, resolveConflict,
    ],
  )

  return <LabStoreContext.Provider value={value}>{children}</LabStoreContext.Provider>
}
