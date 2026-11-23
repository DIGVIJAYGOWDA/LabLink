from fastapi import APIRouter, Query, status

from app.api.deps import RepoDep, error_responses
from app.schemas.lab import ApproveRequest, Booking, BookingCreate, BookingStatus, RejectRequest
from app.services import bookings as service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=list[Booking])
def list_bookings(
    repos: RepoDep,
    student: str | None = Query(None, max_length=80),
    booking_status: BookingStatus | None = Query(None, alias="status"),
    resource_id: str | None = Query(None, alias="resourceId"),
):
    return service.list_bookings(repos, student=student, status=booking_status, resource_id=resource_id)


@router.post("", response_model=Booking, status_code=status.HTTP_201_CREATED, responses=error_responses(404, 409, 422))
def create_booking(payload: BookingCreate, repos: RepoDep):
    """Instant-booking resources are confirmed; approval-required resources create a pending request."""
    return service.create_booking(repos, payload)


@router.get("/{booking_id}", response_model=Booking, responses=error_responses(404))
def get_booking(booking_id: str, repos: RepoDep):
    return service.get_booking(repos, booking_id)


@router.post("/{booking_id}/cancel", response_model=Booking, responses=error_responses(404, 409))
def cancel_booking(booking_id: str, repos: RepoDep):
    """Cancel a confirmed booking or withdraw a pending request."""
    return service.cancel_booking(repos, booking_id)


@router.post("/{booking_id}/approve", response_model=Booking, responses=error_responses(404, 409, 422))
def approve_booking(booking_id: str, repos: RepoDep, payload: ApproveRequest | None = None):
    return service.approve_booking(repos, booking_id, payload.note if payload else None)


@router.post("/{booking_id}/reject", response_model=Booking, responses=error_responses(404, 409, 422))
def reject_booking(booking_id: str, payload: RejectRequest, repos: RepoDep):
    return service.reject_booking(repos, booking_id, payload.note)
