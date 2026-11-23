"""Data-access interfaces. Services depend only on these, so Phase 6 can add
Supabase-backed implementations without touching business logic."""

from typing import Protocol

from app.schemas.lab import Activity, Booking, Resource


class ResourceRepository(Protocol):
    def list(self) -> list[Resource]: ...

    def get(self, resource_id: str) -> Resource | None: ...


class BookingRepository(Protocol):
    def list(self) -> list[Booking]: ...

    def get(self, booking_id: str) -> Booking | None: ...

    def add(self, booking: Booking) -> Booking: ...

    def update(self, booking: Booking) -> Booking: ...


class ActivityRepository(Protocol):
    def list(self, limit: int | None = None) -> list[Activity]:
        """Newest first."""
        ...

    def add(self, activity: Activity) -> Activity: ...
