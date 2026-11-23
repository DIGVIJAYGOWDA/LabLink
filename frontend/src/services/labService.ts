// LabLink data service: API calls to the backend (backend/app/api/routes) plus small pure
// helpers the UI uses to derive slot states, conflicts and charts from the fetched data.
import { apiGet, apiRequest } from '@/services/api'
import { addDays, todayIso } from '@/lib/date'
import type {
  Activity,
  AllocationRecommendation,
  Booking,
  Conflict,
  ConflictResolution,
  LabData,
  LabResource,
  NewBookingInput,
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

/** How many days ahead students can book (matches BOOKING_WINDOW_DAYS on the backend). */
export const BOOKING_WINDOW_DAYS = 14

// ---------- API ----------

export async function fetchLabData(): Promise<LabData> {
  const [resources, bookings, activities] = await Promise.all([
    apiGet<LabResource[]>('/api/resources'),
    apiGet<Booking[]>('/api/bookings'),
    apiGet<Activity[]>('/api/activity?limit=50'),
  ])
  return { resources, bookings, activities }
}

export const fetchBookings = () => apiGet<Booking[]>('/api/bookings')
export const fetchActivity = () => apiGet<Activity[]>('/api/activity?limit=50')

export const createBooking = (input: NewBookingInput & { studentName: string }) =>
  apiRequest<Booking>('/api/bookings', { method: 'POST', body: input })

export const cancelBooking = (id: string) =>
  apiRequest<Booking>(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' })

export const approveBooking = (id: string, note?: string) =>
  apiRequest<Booking>(`/api/bookings/${encodeURIComponent(id)}/approve`, { method: 'POST', body: note ? { note } : {} })

export const rejectBooking = (id: string, note: string) =>
  apiRequest<Booking>(`/api/bookings/${encodeURIComponent(id)}/reject`, { method: 'POST', body: { note } })

export const requestAllocationRecommendation = (conflictId: string) =>
  apiGet<AllocationRecommendation>(`/api/conflicts/${encodeURIComponent(conflictId)}/recommendation`)

export const resolveConflict = (conflictId: string) =>
  apiRequest<ConflictResolution>(`/api/conflicts/${encodeURIComponent(conflictId)}/resolve`, { method: 'POST' })

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

/** Same grouping and id format as the backend (`resourceId:date:slotId`). */
export function findConflicts(bookings: Booking[]): Conflict[] {
  const groups = new Map<string, Booking[]>()
  for (const b of bookings) {
    if (b.status !== 'pending') continue
    const key = `${b.resourceId}:${b.date}:${b.slotId}`
    groups.set(key, [...(groups.get(key) ?? []), b])
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([key, list]) => ({ key, resourceId: list[0].resourceId, date: list[0].date, slotId: list[0].slotId, bookings: list }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.slotId.localeCompare(b.slotId))
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
  const departments = [...new Set(resources.map((r) => r.department))].sort()

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

const SLOT_START_HOUR: Record<SlotId, number> = { s1: 9, s2: 11, s3: 14, s4: 16 }

/** True when the slot has already started (or the day is in the past). */
export function slotStarted(date: string, slotId: SlotId, now = new Date()) {
  const today = todayIso()
  return date < today || (date === today && now.getHours() >= SLOT_START_HOUR[slotId])
}

export interface SlotSuggestion {
  date: string
  slotId: SlotId
}

/**
 * Earliest completely free slots for a resource, from today up to `lastDay`.
 * Used to steer students away from slots that are already booked or contested.
 */
export function suggestFreeSlots(
  bookings: Booking[],
  resourceId: string,
  lastDay: string,
  options: { limit?: number; exclude?: SlotSuggestion; now?: Date } = {},
): SlotSuggestion[] {
  const { limit = 3, exclude, now = new Date() } = options
  const found: SlotSuggestion[] = []
  for (let date = todayIso(); date <= lastDay && found.length < limit; date = addDays(date, 1)) {
    for (const s of TIME_SLOTS) {
      if (found.length >= limit) break
      if (exclude && exclude.date === date && exclude.slotId === s.id) continue
      if (slotStarted(date, s.id, now)) continue
      if (slotState(bookings, resourceId, date, s.id) === 'free') found.push({ date, slotId: s.id })
    }
  }
  return found
}

export interface UtilisationInsights {
  /** Most contested resource this week (most active bookings), if any are booked at all. */
  busiest: { resource: LabResource; active: number; percent: number } | null
  /** Available resources with no bookings in the next `days` days. */
  idle: LabResource[]
}

/** Where demand is concentrated and which equipment is sitting unused, over the next `days` days. */
export function utilisationInsights(resources: LabResource[], bookings: Booking[], days = 7): UtilisationInsights {
  const start = todayIso()
  const end = addDays(start, days - 1)
  const available = resources.filter((r) => r.status === 'available')
  const counts = new Map<string, number>()
  for (const b of bookings) {
    if (isActive(b) && b.date >= start && b.date <= end) counts.set(b.resourceId, (counts.get(b.resourceId) ?? 0) + 1)
  }
  let busiest: UtilisationInsights['busiest'] = null
  for (const r of available) {
    const active = counts.get(r.id) ?? 0
    if (active > 0 && (!busiest || active > busiest.active)) {
      busiest = { resource: r, active, percent: Math.round((active / (days * TIME_SLOTS.length)) * 100) }
    }
  }
  const idle = available.filter((r) => !counts.get(r.id)).sort((a, b) => a.name.localeCompare(b.name))
  return { busiest, idle }
}
