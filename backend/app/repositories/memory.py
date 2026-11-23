"""In-memory repositories (temporary, Phase 5). Data resets when the server restarts."""

from threading import RLock

from app.schemas.lab import Activity, Booking, Resource


class InMemoryResourceRepository:
    def __init__(self, resources: list[Resource]):
        self._items = {r.id: r for r in resources}

    def list(self) -> list[Resource]:
        return list(self._items.values())

    def get(self, resource_id: str) -> Resource | None:
        return self._items.get(resource_id)


class InMemoryBookingRepository:
    def __init__(self, bookings: list[Booking]):
        self._items = {b.id: b for b in bookings}
        self._lock = RLock()

    def list(self) -> list[Booking]:
        with self._lock:
            return list(self._items.values())

    def get(self, booking_id: str) -> Booking | None:
        return self._items.get(booking_id)

    def add(self, booking: Booking) -> Booking:
        with self._lock:
            self._items[booking.id] = booking
        return booking

    def update(self, booking: Booking) -> Booking:
        with self._lock:
            self._items[booking.id] = booking
        return booking


class InMemoryActivityRepository:
    def __init__(self, activities: list[Activity]):
        self._items = sorted(activities, key=lambda a: a.at, reverse=True)
        self._lock = RLock()

    def list(self, limit: int | None = None) -> list[Activity]:
        with self._lock:
            return self._items[:limit] if limit else list(self._items)

    def add(self, activity: Activity) -> Activity:
        with self._lock:
            self._items.insert(0, activity)
        return activity
