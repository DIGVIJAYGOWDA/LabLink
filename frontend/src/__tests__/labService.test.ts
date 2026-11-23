import { describe, expect, it } from 'vitest'

import { addDays, todayIso } from '@/lib/date'
import {
  bookingsPerDay,
  findConflicts,
  isActive,
  resourceUtilisation,
  slotLabel,
  slotStarted,
  slotState,
  suggestFreeSlots,
  TIME_SLOTS,
  utilisationByDepartment,
  utilisationInsights,
} from '@/services/labService'
import type { Booking, BookingStatus, LabResource, SlotId } from '@/types/lab'

let seq = 0
function booking(overrides: Partial<Booking> & { status: BookingStatus }): Booking {
  seq += 1
  return {
    id: `b${seq}`,
    resourceId: 'r1',
    date: todayIso(),
    slotId: 's1' as SlotId,
    studentName: 'Student',
    projectTitle: 'Project',
    purpose: 'Testing',
    deadline: addDays(todayIso(), 10),
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function resource(id: string, department: string, status: LabResource['status'] = 'available'): LabResource {
  return { id, name: `Resource ${id}`, department, status } as LabResource
}

describe('slotLabel', () => {
  it('returns the human label for a known slot', () => {
    expect(slotLabel('s1')).toBe(TIME_SLOTS[0].label)
  })
})

describe('isActive', () => {
  it('treats confirmed and pending bookings as active', () => {
    expect(isActive(booking({ status: 'confirmed' }))).toBe(true)
    expect(isActive(booking({ status: 'pending' }))).toBe(true)
    expect(isActive(booking({ status: 'rejected' }))).toBe(false)
    expect(isActive(booking({ status: 'cancelled' }))).toBe(false)
  })
})

describe('slotState', () => {
  const date = todayIso()
  it('is free when nothing matches', () => {
    expect(slotState([], 'r1', date, 's1')).toBe('free')
  })
  it('is requested when only pending bookings exist', () => {
    expect(slotState([booking({ status: 'pending' })], 'r1', date, 's1')).toBe('requested')
  })
  it('is booked when any booking is confirmed', () => {
    const list = [booking({ status: 'pending' }), booking({ status: 'confirmed' })]
    expect(slotState(list, 'r1', date, 's1')).toBe('booked')
  })
  it('ignores other resources, dates and slots', () => {
    const list = [
      booking({ status: 'confirmed', resourceId: 'r2' }),
      booking({ status: 'confirmed', slotId: 's2' }),
      booking({ status: 'confirmed', date: addDays(date, 1) }),
    ]
    expect(slotState(list, 'r1', date, 's1')).toBe('free')
  })
})

describe('findConflicts', () => {
  it('groups two or more pending requests for the same slot', () => {
    const a = booking({ status: 'pending' })
    const b = booking({ status: 'pending' })
    const conflicts = findConflicts([a, b, booking({ status: 'pending', slotId: 's2' })])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].key).toBe(`r1:${a.date}:s1`)
    expect(conflicts[0].bookings.map((x) => x.id)).toEqual([a.id, b.id])
  })
  it('ignores confirmed bookings', () => {
    expect(findConflicts([booking({ status: 'pending' }), booking({ status: 'confirmed' })])).toEqual([])
  })
  it('sorts conflicts by date then slot', () => {
    const later = addDays(todayIso(), 2)
    const list = [
      booking({ status: 'pending', date: later }),
      booking({ status: 'pending', date: later }),
      booking({ status: 'pending', slotId: 's3' }),
      booking({ status: 'pending', slotId: 's3' }),
    ]
    expect(findConflicts(list).map((c) => c.date)).toEqual([todayIso(), later])
  })
})

describe('utilisation', () => {
  it('computes the share of active slots per department', () => {
    const resources = [resource('r1', 'CSE'), resource('r2', 'ECE'), resource('r3', 'ECE', 'maintenance')]
    const bookings = [
      booking({ status: 'confirmed' }),
      booking({ status: 'pending', slotId: 's2' }),
      booking({ status: 'rejected', slotId: 's3' }),
    ]
    // 2 active slots out of 7 days * 4 slots = 28 for the single CSE resource
    expect(utilisationByDepartment(resources, bookings)).toEqual([
      { label: 'CSE', percent: Math.round((2 / 28) * 100) },
      { label: 'ECE', percent: 0 },
    ])
  })
  it('returns 0 for a department with no available resources', () => {
    expect(utilisationByDepartment([resource('r9', 'MECH', 'maintenance')], [])).toEqual([{ label: 'MECH', percent: 0 }])
  })
  it('ignores bookings outside the window', () => {
    const outside = booking({ status: 'confirmed', date: addDays(todayIso(), 30) })
    expect(resourceUtilisation('r1', [outside])).toBe(0)
    expect(resourceUtilisation('r1', [booking({ status: 'confirmed' })])).toBe(Math.round((1 / 28) * 100))
  })
})

describe('bookingsPerDay', () => {
  it('returns one row per day with confirmed and pending counts', () => {
    const rows = bookingsPerDay([booking({ status: 'confirmed' }), booking({ status: 'pending', slotId: 's2' })], 3)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual({ date: todayIso(), confirmed: 1, pending: 1 })
    expect(rows[1]).toEqual({ date: addDays(todayIso(), 1), confirmed: 0, pending: 0 })
  })
})

/** A fixed early-morning clock so no slot today has started yet. */
const EARLY = new Date(`${todayIso()}T06:00:00`)
const LATE = new Date(`${todayIso()}T20:00:00`)

describe('slotStarted', () => {
  it('marks past days and slots whose start hour has passed', () => {
    expect(slotStarted(addDays(todayIso(), -1), 's4', EARLY)).toBe(true)
    expect(slotStarted(todayIso(), 's1', EARLY)).toBe(false)
    expect(slotStarted(todayIso(), 's4', LATE)).toBe(true)
    expect(slotStarted(addDays(todayIso(), 1), 's1', LATE)).toBe(false)
  })
})

describe('suggestFreeSlots', () => {
  const last = addDays(todayIso(), 3)
  it('returns the earliest free slots, skipping booked and requested ones', () => {
    const list = [booking({ status: 'confirmed', slotId: 's1' }), booking({ status: 'pending', slotId: 's2' })]
    expect(suggestFreeSlots(list, 'r1', last, { now: EARLY })).toEqual([
      { date: todayIso(), slotId: 's3' },
      { date: todayIso(), slotId: 's4' },
      { date: addDays(todayIso(), 1), slotId: 's1' },
    ])
  })
  it('skips slots that have already started today', () => {
    expect(suggestFreeSlots([], 'r1', last, { now: LATE, limit: 1 })).toEqual([{ date: addDays(todayIso(), 1), slotId: 's1' }])
  })
  it('honours the exclusion and the limit', () => {
    const got = suggestFreeSlots([], 'r1', last, { now: EARLY, limit: 2, exclude: { date: todayIso(), slotId: 's1' } })
    expect(got.map((s) => s.slotId)).toEqual(['s2', 's3'])
  })
  it('returns nothing when every slot in the window is taken', () => {
    const today = todayIso()
    const list = TIME_SLOTS.map((s) => booking({ status: 'confirmed', slotId: s.id }))
    expect(suggestFreeSlots(list, 'r1', today, { now: EARLY })).toEqual([])
  })
})

describe('utilisationInsights', () => {
  it('finds the busiest available resource and the idle ones', () => {
    const resources = [resource('r1', 'CSE'), resource('r2', 'ECE'), resource('r3', 'ECE'), resource('r4', 'ME', 'maintenance')]
    const list = [
      booking({ status: 'confirmed' }),
      booking({ status: 'pending', slotId: 's2' }),
      booking({ status: 'confirmed', resourceId: 'r2' }),
      booking({ status: 'cancelled', resourceId: 'r3' }),
    ]
    const { busiest, idle } = utilisationInsights(resources, list)
    expect(busiest).toMatchObject({ active: 2, percent: Math.round((2 / 28) * 100) })
    expect(busiest?.resource.id).toBe('r1')
    expect(idle.map((r) => r.id)).toEqual(['r3'])
  })
  it('reports no busiest resource when nothing is booked', () => {
    expect(utilisationInsights([resource('r1', 'CSE')], []).busiest).toBeNull()
  })
})
