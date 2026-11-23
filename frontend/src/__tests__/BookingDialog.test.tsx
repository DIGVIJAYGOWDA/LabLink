// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import BookingDialog from '@/components/app/BookingDialog'
import { ToastProvider } from '@/components/ui/toast'
import { addDays, todayIso } from '@/lib/date'
import type { Booking, LabResource } from '@/types/lab'

const tomorrow = addDays(todayIso(), 1)
const rival: Booking = {
  id: 'b-rival',
  resourceId: 'r-gpu',
  date: tomorrow,
  slotId: 's1',
  studentName: 'Another Student',
  projectTitle: 'Rival project',
  purpose: 'Training a model',
  deadline: addDays(todayIso(), 5),
  status: 'pending',
  createdAt: new Date().toISOString(),
}
const createBooking = vi.fn(async (input: Partial<Booking>) => ({ ...rival, ...input, id: 'b-new', status: 'pending' }))

vi.mock('@/hooks/useLabStore', () => ({
  useLabStore: () => ({ bookings: [rival], createBooking, currentUser: 'Demo Student' }),
}))

const gpu: LabResource = {
  id: 'r-gpu',
  name: 'GPU Workstation',
  type: 'workstation',
  department: 'CSE',
  lab: 'AI Lab',
  description: 'RTX GPU',
  requiresApproval: true,
  status: 'available',
}

beforeAll(() => {
  // jsdom has no modal dialogs yet
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
})
afterEach(cleanup)

function renderDialog(onClose = vi.fn()) {
  render(
    <ToastProvider>
      <BookingDialog resource={gpu} onClose={onClose} />
    </ToastProvider>,
  )
  return onClose
}

describe('BookingDialog', () => {
  it('shows validation errors instead of submitting an incomplete request', async () => {
    renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }))
    expect(await screen.findByText('Choose a time slot.')).toBeTruthy()
    expect(screen.getByText(/Enter a project title/)).toBeTruthy()
    expect(screen.getByText(/Describe what you need/)).toBeTruthy()
    expect(createBooking).not.toHaveBeenCalled()
  })

  it('offers free slots for a contested slot and books the chosen one', async () => {
    const onClose = renderDialog()
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: tomorrow } })
    fireEvent.click(screen.getByRole('radio', { name: /09:00 - 11:00/ }))
    expect(screen.getByText(/Skip the queue/)).toBeTruthy()

    const firstFree = screen.getAllByRole('button').find((b) => b.textContent?.includes('·'))
    fireEvent.click(firstFree!)
    expect(screen.queryByText(/Skip the queue/)).toBeNull() // the picked slot is free, so no conflict any more

    fireEvent.change(screen.getByLabelText('Project title'), { target: { value: 'Crop disease detection' } })
    fireEvent.change(screen.getByLabelText('Requirements and purpose'), { target: { value: 'Train a CNN on 20k leaf images' } })
    fireEvent.change(screen.getByLabelText('Project deadline'), { target: { value: addDays(todayIso(), 7) } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: 'r-gpu', projectTitle: 'Crop disease detection' }),
    )
    const sent = createBooking.mock.calls[0][0]
    expect(sent.date === tomorrow && sent.slotId === 's1').toBe(false)
  })
})
