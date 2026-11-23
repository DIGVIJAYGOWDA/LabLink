import { describe, expect, it } from 'vitest'

import { addDays, parseIsoDate, toIsoDate, todayIso } from '@/lib/date'

describe('date helpers', () => {
  it('round-trips ISO dates without timezone drift', () => {
    expect(toIsoDate(parseIsoDate('2026-03-09'))).toBe('2026-03-09')
  })
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('todayIso matches the YYYY-MM-DD format', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
