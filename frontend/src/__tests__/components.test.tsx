// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import FormattedText from '@/components/app/FormattedText'
import SlotSuggestions from '@/components/app/SlotSuggestions'
import UtilisationInsights from '@/components/app/UtilisationInsights'
import { StatusBadge } from '@/components/app/common'
import { addDays, todayIso } from '@/lib/date'
import type { LabResource } from '@/types/lab'

afterEach(cleanup)

const gpu = { id: 'r-gpu', name: 'GPU Workstation', department: 'CSE', status: 'available' } as LabResource
const scope = { id: 'r-osc', name: 'Oscilloscope', department: 'ECE', status: 'available' } as LabResource

describe('FormattedText', () => {
  it('renders paragraphs, bullet lists and bold text from the chatbot reply', () => {
    const { container } = render(<FormattedText text={'## Free labs\nToday:\n- **GPU Workstation** 09:00\n2. Oscilloscope'} />)
    expect(screen.getByText('Free labs').tagName).toBe('P') // heading markers are stripped
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(screen.getByText('GPU Workstation').tagName).toBe('STRONG')
  })
})

describe('SlotSuggestions', () => {
  const tomorrow = addDays(todayIso(), 1)

  it('lists free slots and returns the chosen one', () => {
    const onPick = vi.fn()
    render(<SlotSuggestions contested suggestions={[{ date: tomorrow, slotId: 's2' }]} onPick={onPick} />)
    expect(screen.getByText(/Skip the queue/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /11:00 - 13:00/ }))
    expect(onPick).toHaveBeenCalledWith({ date: tomorrow, slotId: 's2' })
  })

  it('explains a full day and an empty window', () => {
    const { rerender } = render(<SlotSuggestions contested={false} suggestions={[{ date: tomorrow, slotId: 's1' }]} onPick={vi.fn()} />)
    expect(screen.getByText(/No free slots on this day/)).toBeTruthy()
    rerender(<SlotSuggestions contested={false} suggestions={[]} onPick={vi.fn()} />)
    expect(screen.getByText(/No completely free slots/)).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('UtilisationInsights', () => {
  const insights = { busiest: { resource: gpu, active: 4, percent: 14 }, idle: [scope] }

  it('links the busiest and idle equipment to the filtered catalogue', () => {
    render(<UtilisationInsights insights={insights} role="student" />, { wrapper: MemoryRouter })
    expect(screen.getByRole('link', { name: 'GPU Workstation' }).getAttribute('href')).toBe('/app/catalogue?q=GPU%20Workstation')
    expect(screen.getByRole('link', { name: 'Oscilloscope' })).toBeTruthy()
    expect(screen.getByText(/Book early/)).toBeTruthy()
  })

  it('gives faculty an action instead', () => {
    render(<UtilisationInsights insights={insights} role="faculty" />, { wrapper: MemoryRouter })
    expect(screen.getByText(/Consider extra lab hours/)).toBeTruthy()
    expect(screen.getByText(/Promote these/)).toBeTruthy()
  })

  it('renders nothing when there is no insight', () => {
    const { container } = render(<UtilisationInsights insights={{ busiest: null, idle: [] }} role="student" />, {
      wrapper: MemoryRouter,
    })
    expect(container.innerHTML).toBe('')
  })
})

describe('StatusBadge', () => {
  it('shows a readable label for each booking status', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText(/pending|awaiting/i)).toBeTruthy()
  })
})
