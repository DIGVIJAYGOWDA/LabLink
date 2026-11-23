from datetime import timedelta

from app.core.errors import BusinessRuleError
from app.repositories import Repositories
from app.schemas.lab import DashboardSummary, DayCount, Role, UtilisationRow
from app.services import scheduling
from app.services.allocation import find_conflicts

DAYS = 7


def get_summary(repos: Repositories, role: Role, student: str | None) -> DashboardSummary:
    if role == "student" and not (student and student.strip()):
        raise BusinessRuleError("The student view needs a student name.", field="student")

    resources = repos.resources.list()
    bookings = repos.bookings.list()
    today = scheduling.today()
    week_end = today + timedelta(days=DAYS - 1)

    def mine(b) -> bool:
        return role == "faculty" or b.student_name.lower() == student.strip().lower()

    scoped = [b for b in bookings if mine(b)]
    conflicts = [c for c in find_conflicts(bookings) if role == "faculty" or any(mine(b) for b in c.bookings)]

    per_day = []
    for i in range(DAYS):
        day = today + timedelta(days=i)
        on_day = [b for b in bookings if b.date == day]
        per_day.append(
            DayCount(
                date=day,
                confirmed=sum(b.status == "confirmed" for b in on_day),
                pending=sum(b.status == "pending" for b in on_day),
            )
        )

    capacity_per_resource = DAYS * len(scheduling.TIME_SLOTS)
    utilisation = []
    for dept in sorted({r.department for r in resources}):
        ids = {r.id for r in resources if r.department == dept and r.status == "available"}
        used = sum(1 for b in bookings if b.resource_id in ids and scheduling.is_active(b) and today <= b.date <= week_end)
        capacity = len(ids) * capacity_per_resource
        utilisation.append(UtilisationRow(label=dept, percent=round(used / capacity * 100) if capacity else 0))

    return DashboardSummary(
        role=role,
        available_resources=sum(r.status == "available" for r in resources),
        total_resources=len(resources),
        upcoming_bookings=sum(b.status == "confirmed" and b.date >= today for b in scoped),
        pending_requests=sum(b.status == "pending" for b in scoped),
        conflicts=len(conflicts),
        confirmed_this_week=sum(b.status == "confirmed" and today <= b.date <= week_end for b in bookings),
        bookings_per_day=per_day,
        utilisation_by_department=utilisation,
    )
