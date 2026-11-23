"""Slot conflicts and fair allocation.

The recommendation is rule-based so it is always feasible and explainable:
1. Urgency: the request with the nearest project deadline keeps the slot.
2. Fairness: on equal deadlines, the student who already holds fewer confirmed slots on this
   resource in the booking window goes first, so nobody monopolises shared equipment.
3. Submission time breaks any remaining tie.
Every other request moves to the earliest free slot for the same resource, searching from
today, so it lands before its own deadline whenever any such slot exists. Gemini then
explains the decision to faculty using the deadlines and the students' stated requirements.
"""

from datetime import date, timedelta

from app.core.errors import AppError, NotFoundError
from app.repositories import Repositories
from app.schemas.lab import AllocationRecommendation, Booking, Conflict, ConflictResolution, Reassignment
from app.services import gemini, scheduling
from app.services.activity import log_activity
from app.services.catalogue import get_resource


def conflict_id(resource_id: str, day: date, slot_id: str) -> str:
    return f"{resource_id}:{day.isoformat()}:{slot_id}"


def find_conflicts(bookings: list[Booking]) -> list[Conflict]:
    groups: dict[str, list[Booking]] = {}
    for b in bookings:
        if b.status == "pending":
            groups.setdefault(conflict_id(b.resource_id, b.date, b.slot_id), []).append(b)
    conflicts = [
        Conflict(id=key, resource_id=items[0].resource_id, date=items[0].date, slot_id=items[0].slot_id, bookings=items)
        for key, items in groups.items()
        if len(items) > 1
    ]
    return sorted(conflicts, key=lambda c: (c.date, c.slot_id))


def list_conflicts(repos: Repositories) -> list[Conflict]:
    return find_conflicts(repos.bookings.list())


def get_conflict(repos: Repositories, cid: str) -> Conflict:
    conflict = next((c for c in list_conflicts(repos) if c.id == cid), None)
    if not conflict:
        raise NotFoundError(f"No open conflict with id '{cid}'. It may already be resolved.")
    return conflict


def recent_usage(bookings: list[Booking], resource_id: str, student: str, exclude: set[str]) -> int:
    """Confirmed slots the student already holds on this resource within the booking window."""
    start, end = scheduling.today(), scheduling.window_end()
    return sum(
        1
        for b in bookings
        if b.resource_id == resource_id
        and b.student_name == student
        and b.status == "confirmed"
        and b.id not in exclude
        and start <= b.date <= end
    )


def recommend(conflict: Conflict, bookings: list[Booking]) -> AllocationRecommendation:
    conflict_ids = {b.id for b in conflict.bookings}
    usage = {
        b.id: recent_usage(bookings, conflict.resource_id, b.student_name, conflict_ids) for b in conflict.bookings
    }
    ranked = sorted(conflict.bookings, key=lambda b: (b.deadline, usage[b.id], b.created_at))
    winner, others = ranked[0], ranked[1:]
    other_ids = {o.id for o in others}
    taken = {
        (b.date, b.slot_id)
        for b in bookings
        if b.resource_id == conflict.resource_id and scheduling.is_active(b) and b.id not in other_ids
    }

    reassignments: list[Reassignment] = []
    unplaced: list[str] = []
    # Search from today, not from the conflict date: an earlier free slot is better for a near deadline.
    start = scheduling.today()
    last = scheduling.window_end()
    for other in others:
        slot = None
        day = start
        while day <= last and slot is None:
            for s in scheduling.TIME_SLOTS:
                if (day, s.id) not in taken and not scheduling.slot_started(day, s.id):
                    slot = (day, s.id)
                    break
            day += timedelta(days=1)
        if slot is None:
            unplaced.append(other.id)
            continue
        taken.add(slot)
        reassignments.append(
            Reassignment(booking_id=other.id, date=slot[0], slot_id=slot[1], after_deadline=slot[0] > other.deadline)
        )

    tied = [o for o in others if o.deadline == winner.deadline]
    if not tied:
        reason = f"{winner.student_name} has the nearest project deadline, so they keep the slot."
    elif any(usage[o.id] > usage[winner.id] for o in tied):
        reason = (
            f"{winner.student_name} shares the nearest project deadline and has had less time on this "
            "equipment this fortnight, so they keep the slot."
        )
    else:
        reason = (
            f"{winner.student_name} shares the nearest project deadline and submitted first, so they keep the slot."
        )
    late = [r for r in reassignments if r.after_deadline]
    if reassignments and not late:
        reason += " Every other request moves to a free slot before its own deadline."
    return AllocationRecommendation(
        conflict_id=conflict.id, winner_id=winner.id, reason=reason, reassignments=reassignments, unplaced_ids=unplaced
    )


def _ai_explanation(
    conflict: Conflict, rec: AllocationRecommendation, resource_name: str, bookings: list[Booking]
) -> str | None:
    """Ask Gemini to explain the decision using deadlines AND the students' stated requirements.
    The allocation itself stays rule-based so it is always feasible and consistent."""
    conflict_ids = {b.id for b in conflict.bookings}
    requests = "\n".join(
        f"- id {b.id}: {b.student_name}, project '{b.project_title}', deadline {b.deadline.isoformat()}, "
        f"submitted {b.created_at:%Y-%m-%d %H:%M}, requirements: {b.purpose or 'not given'}, "
        f"confirmed slots already held on this equipment: "
        f"{recent_usage(bookings, conflict.resource_id, b.student_name, conflict_ids)}"
        for b in conflict.bookings
    )
    moves = (
        "\n".join(
            f"- {r.booking_id} moves to {r.date.isoformat()} {scheduling.slot_label(r.slot_id)}"
            + (" (after their deadline)" if r.after_deadline else "")
            for r in rec.reassignments
        )
        or "- none"
    )
    prompt = (
        f"Slot conflict on the {resource_name}, "
        f"{conflict.date.isoformat()} {scheduling.slot_label(conflict.slot_id)}.\n"
        f"Competing requests:\n{requests}\n\nDecision: {rec.winner_id} keeps the slot.\nMoves:\n{moves}\n"
        f"Unplaced: {', '.join(rec.unplaced_ids) or 'none'}\n\n"
        "Rule: nearest deadline first; on equal deadlines, less recent use of this equipment first; then earlier "
        "submission.\n\n"
        "In at most 2 short sentences for faculty, explain why this allocation is fair and feasible, referring to the "
        "deadlines and the stated requirements. Use student names, not ids. "
        "Do not change the decision. Plain text only."
    )
    try:
        return gemini.generate(
            "You explain lab-equipment allocation decisions clearly and neutrally.", [("user", prompt)]
        )
    except AppError:
        return None


def get_recommendation(repos: Repositories, cid: str) -> AllocationRecommendation:
    conflict = get_conflict(repos, cid)
    bookings = repos.bookings.list()
    rec = recommend(conflict, bookings)
    if gemini.gemini_configured():
        explanation = _ai_explanation(conflict, rec, get_resource(repos, conflict.resource_id).name, bookings)
        if explanation:
            rec = rec.model_copy(update={"reason": explanation, "explanation_source": "gemini"})
    return rec


def resolve_conflict(repos: Repositories, cid: str) -> ConflictResolution:
    """Applies the current recommendation: approves the winner and moves the others (still pending)."""
    with scheduling.booking_lock:
        conflict = get_conflict(repos, cid)
        rec = recommend(conflict, repos.bookings.list())
        updated: list[Booking] = []
        for b in conflict.bookings:
            if b.id == rec.winner_id:
                patch = {"status": "confirmed", "faculty_note": "Approved using the allocation recommendation."}
            else:
                move = next((r for r in rec.reassignments if r.booking_id == b.id), None)
                if not move:
                    continue  # no free slot: left pending for faculty to decline
                patch = {
                    "date": move.date,
                    "slot_id": move.slot_id,
                    "faculty_note": (
                        f"Moved to {scheduling.format_day(move.date)}, {scheduling.slot_label(move.slot_id)} "
                        "to resolve a slot conflict. Awaiting approval."
                    ),
                }
            updated.append(repos.bookings.update(b.model_copy(update=patch)))

    resource = get_resource(repos, conflict.resource_id)
    log_activity(repos, "allocation", f"Conflict on the {resource.name} resolved with the allocation recommendation")
    return ConflictResolution(recommendation=rec, bookings=updated)
