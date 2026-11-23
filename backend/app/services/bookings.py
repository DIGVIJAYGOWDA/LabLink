from datetime import datetime, timezone
from uuid import uuid4

from app.core.errors import BusinessRuleError, ConflictError, NotFoundError
from app.repositories import Repositories
from app.schemas.lab import Booking, BookingCreate, BookingStatus
from app.services import scheduling
from app.services.activity import log_activity
from app.services.catalogue import get_resource

MIN_PURPOSE_LENGTH = 10


def list_bookings(
    repos: Repositories,
    *,
    student: str | None = None,
    status: BookingStatus | None = None,
    resource_id: str | None = None,
) -> list[Booking]:
    items = [
        b
        for b in repos.bookings.list()
        if (not student or b.student_name.lower() == student.strip().lower())
        and (not status or b.status == status)
        and (not resource_id or b.resource_id == resource_id)
    ]
    return sorted(items, key=lambda b: (b.date, b.slot_id))


def get_booking(repos: Repositories, booking_id: str) -> Booking:
    booking = repos.bookings.get(booking_id)
    if not booking:
        raise NotFoundError(f"Booking '{booking_id}' was not found.")
    return booking


def create_booking(repos: Repositories, payload: BookingCreate) -> Booking:
    resource = get_resource(repos, payload.resource_id)
    today = scheduling.today()

    if resource.status != "available":
        raise ConflictError(f"{resource.name} is under maintenance and cannot be booked.", code="resource_unavailable")
    if payload.date < today or payload.date > scheduling.window_end():
        raise BusinessRuleError(
            f"Pick a date within the next {scheduling.get_settings().booking_window_days} days.", field="date"
        )
    if scheduling.slot_started(payload.date, payload.slot_id):
        raise BusinessRuleError("This slot has already started.", field="slotId")
    if payload.deadline < today:
        raise BusinessRuleError("The project deadline cannot be in the past.", field="deadline")
    if resource.requires_approval and len(payload.purpose) < MIN_PURPOSE_LENGTH:
        raise BusinessRuleError(
            f"Describe what you need the resource for (at least {MIN_PURPOSE_LENGTH} characters).", field="purpose"
        )

    with scheduling.booking_lock:
        existing = repos.bookings.list()
        if scheduling.slot_state(existing, resource.id, payload.date, payload.slot_id) == "booked":
            raise ConflictError("This slot is already booked.", code="slot_unavailable", field="slotId")
        duplicate = any(
            b.resource_id == resource.id
            and b.date == payload.date
            and b.slot_id == payload.slot_id
            and b.student_name.lower() == payload.student_name.lower()
            and scheduling.is_active(b)
            for b in existing
        )
        if duplicate:
            raise ConflictError(
                "You already have a booking or request for this slot.", code="duplicate_booking", field="slotId"
            )

        booking = Booking(
            id=f"b-{uuid4().hex[:10]}",
            **payload.model_dump(),
            status="pending" if resource.requires_approval else "confirmed",
            created_at=datetime.now(timezone.utc),
        )
        repos.bookings.add(booking)

    verb = "requested" if booking.status == "pending" else "booked"
    log_activity(repos, "request" if booking.status == "pending" else "booking", f"{booking.student_name} {verb} the {resource.name}")
    return booking


def cancel_booking(repos: Repositories, booking_id: str) -> Booking:
    with scheduling.booking_lock:
        booking = get_booking(repos, booking_id)
        if not scheduling.is_active(booking):
            raise ConflictError(f"A {booking.status} booking cannot be cancelled.", code="invalid_state")
        if booking.date < scheduling.today():
            raise ConflictError("Past bookings cannot be cancelled.", code="invalid_state")
        updated = repos.bookings.update(booking.model_copy(update={"status": "cancelled"}))

    resource = get_resource(repos, booking.resource_id)
    log_activity(repos, "cancellation", f"{booking.student_name} cancelled the {resource.name} booking")
    return updated


def _pending(repos: Repositories, booking_id: str) -> Booking:
    booking = get_booking(repos, booking_id)
    if booking.status != "pending":
        raise ConflictError(f"Only pending requests can be reviewed (this one is {booking.status}).", code="invalid_state")
    return booking


def approve_booking(repos: Repositories, booking_id: str, note: str | None = None) -> Booking:
    with scheduling.booking_lock:
        booking = _pending(repos, booking_id)
        if scheduling.slot_state(repos.bookings.list(), booking.resource_id, booking.date, booking.slot_id) == "booked":
            raise ConflictError("Another booking already holds this slot.", code="slot_unavailable")
        updated = repos.bookings.update(booking.model_copy(update={"status": "confirmed", "faculty_note": note or "Approved."}))

    resource = get_resource(repos, booking.resource_id)
    log_activity(repos, "approval", f"Faculty approved {booking.student_name} on the {resource.name}")
    return updated


def reject_booking(repos: Repositories, booking_id: str, note: str) -> Booking:
    with scheduling.booking_lock:
        booking = _pending(repos, booking_id)
        updated = repos.bookings.update(booking.model_copy(update={"status": "rejected", "faculty_note": note}))

    resource = get_resource(repos, booking.resource_id)
    log_activity(repos, "rejection", f"Faculty declined {booking.student_name}'s {resource.name} request")
    return updated
