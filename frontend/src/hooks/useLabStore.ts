import { createContext, useContext } from 'react'

import type { Activity, Booking, Conflict, LabResource, NewBookingInput, Role } from '@/types/lab'

/** App state for the core features; provided by LabStoreProvider. */
export interface LabStore {
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
  createBooking: (input: NewBookingInput) => Promise<Booking>
  cancelBooking: (id: string) => Promise<Booking>
  approveBooking: (id: string, note?: string) => Promise<Booking>
  rejectBooking: (id: string, note: string) => Promise<Booking>
  resolveConflict: (conflictId: string) => Promise<void>
}

export const LabStoreContext = createContext<LabStore | null>(null)

export function useLabStore() {
  const ctx = useContext(LabStoreContext)
  if (!ctx) throw new Error('useLabStore must be used inside LabStoreProvider')
  return ctx
}
