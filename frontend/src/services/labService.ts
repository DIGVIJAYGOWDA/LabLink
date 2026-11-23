// LabLink data service.
//
// INTEGRATION POINT: the backend currently exposes only GET /api/health and there is no
// database schema yet, so the async functions below resolve mock data. When the backend
// adds catalogue/booking/allocation endpoints, replace their bodies with `apiGet`/fetch calls
// from '@/services/api' and keep the same signatures. The pure helpers further down
// (availability, conflicts, utilisation) work on whatever data those calls return.
import { createMockLabData } from '@/data/mockLab'
import { addDays, todayIso } from '@/lib/date'
import type {
  AllocationRecommendation,
  Booking,
  Conflict,
  LabData,
  LabResource,
  Reassignment,
  SlotId,
  SlotState,
  TimeSlot,
} from '@/types/lab'

export const TIME_SLOTS: TimeSlot[] = [
  { id: 's1', label: '09:00 - 11:00' },
  { id: 's2', label: '11:00 - 13:00' },
  { id: 's3', label: '14:00 - 16:00' },
  { id: 's4', label: '16:00 - 18:00' },
]

/** How many days ahead students can book. */
export const BOOKING_WINDOW_DAYS = 14

const MOCK_LATENCY_MS = 400

function delay<T>(value: T, ms = MOCK_LATENCY_MS) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
}

/** MOCK: loads catalogue, bookings and activity. Replace with backend calls later. */
export function fetchLabData(): Promise<LabData> {
  return delay(createMockLabData())
}

/**
 * MOCK: stands in for the planned Gemini-powered allocation recommendation (README: "AI recommends
 * fair, feasible allocations ... using project deadlines, availability and student requirements").
 * Uses a transparent deadline-first rule locally. Replace with the backend AI call when available.
 */
export function requestAllocationRecommendation(
  conflict: Conflict,
  bookings: Booking[],
): Promise<AllocationRecommendation> {
  return delay(recommendAllocation(conflict, bookings), 700)
}

// ---------- Pure helpers ----------

export function slotLabel(id: SlotId) {
  return TIME_SLOTS.find((s) => s.id === id)?.label ?? id
}

export function isActive(b: Booking) {
  return b.status === 'confirmed' || b.status === 'pending'
}

export function slotState(bookings: Booking[], resourceId: string, date: string, slotId: SlotId): SlotState {
  let state: SlotState = 'free'
  for (const b of bookings) {
    if (b.resourceId !== resourceId || b.date !== date || b.slotId !== slotId) continue
    if (b.status === 'confirmed') return 'booked'
    if (b.status === 'pending') state = 'requested'
  }
  return state
}

export function findConflicts(bookings: Booking[]): Conflict[] {
  const groups = new Map<string, Booking[]>()
  for (const b of bookings) {
    if (b.status !== 'pending') continue
    const key = `${b.resourceId}|${b.date}|${b.slotId}`
    groups.set(key, [...(groups.get(key) ?? []), b])
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([key, list]) => ({
      key,
      resourceId: list[0].resourceId,
      date: list[0].date,
      slotId: list[0].slotId,
      bookings: list,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function byDeadlineThenSubmitted(a: Booking, b: Booking) {
  return a.deadline.localeCompare(b.deadline) || a.createdAt.localeCompare(b.createdAt)
}

export function recommendAllocation(conflict: Conflict, bookings: Booking[]): AllocationRecommendation {
  const ranked = [...conflict.bookings].sort(byDeadlineThenSubmitted)
  const [winner, ...others] = ranked
  const taken = new Set(
    bookings.filter((b) => isActive(b) && !others.some((o) => o.id === b.id)).map((b) => `${b.date}|${b.slotId}|${b.resourceId}`),
  )
  const lastDay = addDays(todayIso(), BOOKING_WINDOW_DAYS)
  const reassignments: Reassignment[] = []
  const unplacedIds: string[] = []

  for (const other of others) {
    let placed = false
    for (let date = conflict.date; date <= lastDay && !placed; date = addDays(date, 1)) {
      for (const slot of TIME_SLOTS) {
        const key = `${date}|${slot.id}|${conflict.resourceId}`
        if (taken.has(key)) continue
        taken.add(key)
        reassignments.push({ bookingId: other.id, date, slotId: slot.id, afterDeadline: date > other.deadline })
        placed = true
        break
      }
    }
    if (!placed) unplacedIds.push(other.id)
  }

  const tie = others.some((o) => o.deadline === winner.deadline)
  const reason = tie
    ? `${winner.studentName} shares the nearest project deadline and submitted first, so they keep the slot.`
    : `${winner.studentName} has the nearest project deadline, so they keep the slot.`

  return { conflictKey: conflict.key, winnerId: winner.id, reason, reassignments, unplacedIds }
}

export interface UtilisationRow {
  label: string
  percent: number
}

/** Share of slots booked or requested over the next `days` days, grouped by department. */
export function utilisationByDepartment(resources: LabResource[], bookings: Booking[], days = 7): UtilisationRow[] {
  const start = todayIso()
  const end = addDays(start, days - 1)
  const capacityPerResource = days * TIME_SLOTS.length
  const departments = [...new Set(resources.map((r) => r.department))]

  return departments.map((department) => {
    const ids = new Set(resources.filter((r) => r.department === department && r.status === 'available').map((r) => r.id))
    const used = bookings.filter((b) => ids.has(b.resourceId) && isActive(b) && b.date >= start && b.date <= end).length
    const capacity = ids.size * capacityPerResource
    return { label: department, percent: capacity ? Math.round((used / capacity) * 100) : 0 }
  })
}

export function resourceUtilisation(resourceId: string, bookings: Booking[], days = 7) {
  const start = todayIso()
  const end = addDays(start, days - 1)
  const used = bookings.filter((b) => b.resourceId === resourceId && isActive(b) && b.date >= start && b.date <= end).length
  return Math.round((used / (days * TIME_SLOTS.length)) * 100)
}

export function bookingsPerDay(bookings: Booking[], days = 7) {
  const start = todayIso()
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i)
    const dayBookings = bookings.filter((b) => b.date === date)
    return {
      date,
      confirmed: dayBookings.filter((b) => b.status === 'confirmed').length,
      pending: dayBookings.filter((b) => b.status === 'pending').length,
    }
  })
}
