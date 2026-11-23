// Domain types for LabLink's core features (catalogue, booking, approvals, allocation).

export type ResourceType = 'equipment' | 'kit' | 'workstation'
export type ResourceStatus = 'available' | 'maintenance'

export interface LabResource {
  id: string
  name: string
  type: ResourceType
  department: string
  lab: string
  description: string
  /** Project-based access request that faculty must approve before the slot is confirmed. */
  requiresApproval: boolean
  status: ResourceStatus
}

export type SlotId = 's1' | 's2' | 's3' | 's4'

export interface TimeSlot {
  id: SlotId
  label: string
}

export type BookingStatus = 'confirmed' | 'pending' | 'rejected' | 'cancelled'

export interface Booking {
  id: string
  resourceId: string
  /** ISO date, YYYY-MM-DD */
  date: string
  slotId: SlotId
  studentName: string
  projectTitle: string
  purpose: string
  /** Project deadline, ISO date */
  deadline: string
  status: BookingStatus
  /** ISO timestamp */
  createdAt: string
  facultyNote?: string
}

export interface NewBookingInput {
  resourceId: string
  date: string
  slotId: SlotId
  projectTitle: string
  purpose: string
  deadline: string
}

export type Role = 'student' | 'faculty'

export type ActivityKind = 'booking' | 'request' | 'approval' | 'rejection' | 'cancellation' | 'allocation'

export interface Activity {
  id: string
  kind: ActivityKind
  message: string
  /** ISO timestamp */
  at: string
}

export type SlotState = 'free' | 'requested' | 'booked'

/** Two or more pending requests for the same resource, date and slot. */
export interface Conflict {
  key: string
  resourceId: string
  date: string
  slotId: SlotId
  bookings: Booking[]
}

export interface Reassignment {
  bookingId: string
  date: string
  slotId: SlotId
  afterDeadline: boolean
}

export interface AllocationRecommendation {
  conflictKey: string
  winnerId: string
  reason: string
  reassignments: Reassignment[]
  /** Requests for which no free slot was found in the booking window. */
  unplacedIds: string[]
}

export interface LabData {
  resources: LabResource[]
  bookings: Booking[]
  activities: Activity[]
}
