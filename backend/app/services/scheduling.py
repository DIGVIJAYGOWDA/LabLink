"""Shared scheduling rules: time slots, booking window and slot occupancy."""

from datetime import date, datetime, timedelta
from threading import RLock
from zoneinfo import ZoneInfo

from app.core.config import get_settings
from app.schemas.lab import Booking, SlotId, SlotState, TimeSlot

TIME_SLOTS: list[TimeSlot] = [
    TimeSlot(id="s1", label="09:00 - 11:00"),
    TimeSlot(id="s2", label="11:00 - 13:00"),
    TimeSlot(id="s3", label="14:00 - 16:00"),
    TimeSlot(id="s4", label="16:00 - 18:00"),
]
SLOT_START_HOUR: dict[str, int] = {"s1": 9, "s2": 11, "s3": 14, "s4": 16}

# Serialises check-then-write booking operations so two requests cannot take the same slot.
booking_lock = RLock()


def now() -> datetime:
    """Current campus time (see Settings.timezone)."""
    return datetime.now(ZoneInfo(get_settings().timezone))


def today() -> date:
    return now().date()


def window_end() -> date:
    return today() + timedelta(days=get_settings().booking_window_days)


def slot_label(slot_id: str) -> str:
    return next((s.label for s in TIME_SLOTS if s.id == slot_id), slot_id)


def slot_started(day: date, slot_id: str) -> bool:
    current = now()
    return day < current.date() or (day == current.date() and current.hour >= SLOT_START_HOUR[slot_id])


def is_active(booking: Booking) -> bool:
    return booking.status in ("confirmed", "pending")


def slot_state(bookings: list[Booking], resource_id: str, day: date, slot_id: SlotId) -> SlotState:
    state: SlotState = "free"
    for b in bookings:
        if b.resource_id != resource_id or b.date != day or b.slot_id != slot_id:
            continue
        if b.status == "confirmed":
            return "booked"
        if b.status == "pending":
            state = "requested"
    return state


def format_day(day: date) -> str:
    return day.strftime("%a, %d %b")
