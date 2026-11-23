"""Request/response models for LabLink's core features.

Field names mirror frontend/src/types/lab.ts (serialised as camelCase).
"""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import Field, StringConstraints

from app.schemas.common import ApiModel

ResourceType = Literal["equipment", "kit", "workstation"]
ResourceStatus = Literal["available", "maintenance"]
SlotId = Literal["s1", "s2", "s3", "s4"]
BookingStatus = Literal["confirmed", "pending", "rejected", "cancelled"]
SlotState = Literal["free", "requested", "booked"]
ActivityKind = Literal["booking", "request", "approval", "rejection", "cancellation", "allocation"]
Role = Literal["student", "faculty"]


# ---------- Catalogue ----------


class Resource(ApiModel):
    id: str
    name: str
    type: ResourceType
    department: str
    lab: str
    description: str
    requires_approval: bool
    status: ResourceStatus


class TimeSlot(ApiModel):
    id: SlotId
    label: str


class SlotAvailability(TimeSlot):
    state: SlotState
    started: bool


class ResourceAvailability(ApiModel):
    resource_id: str
    date: date
    bookable: bool
    slots: list[SlotAvailability]


# ---------- Bookings ----------


class Booking(ApiModel):
    id: str
    resource_id: str
    date: date
    slot_id: SlotId
    student_name: str
    project_title: str
    purpose: str
    deadline: date
    status: BookingStatus
    created_at: datetime
    faculty_note: str | None = None


ProjectTitle = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=80)]
StudentName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
Purpose = Annotated[str, StringConstraints(strip_whitespace=True, max_length=400)]
Note = Annotated[str, StringConstraints(strip_whitespace=True, max_length=300)]


class BookingCreate(ApiModel):
    resource_id: str = Field(min_length=1)
    date: date
    slot_id: SlotId
    student_name: StudentName
    project_title: ProjectTitle
    purpose: Purpose = ""
    deadline: date


class ApproveRequest(ApiModel):
    note: Note | None = None


class RejectRequest(ApiModel):
    note: Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=300)]


# ---------- Activity ----------


class Activity(ApiModel):
    id: str
    kind: ActivityKind
    message: str
    at: datetime


# ---------- Conflicts and allocation ----------


class Conflict(ApiModel):
    id: str
    resource_id: str
    date: date
    slot_id: SlotId
    bookings: list[Booking]


class Reassignment(ApiModel):
    booking_id: str
    date: date
    slot_id: SlotId
    after_deadline: bool


class AllocationRecommendation(ApiModel):
    conflict_id: str
    winner_id: str
    reason: str
    reassignments: list[Reassignment]
    unplaced_ids: list[str]
    # "gemini" when the reason was written by the AI model, "rule" for the built-in explanation
    explanation_source: Literal["rule", "gemini"] = "rule"


class ConflictResolution(ApiModel):
    recommendation: AllocationRecommendation
    bookings: list[Booking]


# ---------- Dashboard ----------


class DayCount(ApiModel):
    date: date
    confirmed: int
    pending: int


class UtilisationRow(ApiModel):
    label: str
    percent: int


class DashboardSummary(ApiModel):
    role: Role
    available_resources: int
    total_resources: int
    upcoming_bookings: int
    pending_requests: int
    conflicts: int
    confirmed_this_week: int
    bookings_per_day: list[DayCount]
    utilisation_by_department: list[UtilisationRow]


# ---------- AI assistant ----------


class ChatMessage(ApiModel):
    role: Literal["user", "assistant"]
    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class ChatRequest(ApiModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    role: Role = "student"
    student_name: StudentName | None = None


class ChatResponse(ApiModel):
    reply: str
    source: Literal["gemini", "fallback"]
