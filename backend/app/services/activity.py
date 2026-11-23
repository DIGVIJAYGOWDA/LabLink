from datetime import UTC, datetime
from uuid import uuid4

from app.repositories import Repositories
from app.schemas.lab import Activity, ActivityKind


def log_activity(repos: Repositories, kind: ActivityKind, message: str) -> Activity:
    return repos.activities.add(Activity(id=f"a-{uuid4().hex[:10]}", kind=kind, message=message, at=datetime.now(UTC)))


def list_activity(repos: Repositories, limit: int) -> list[Activity]:
    return repos.activities.list(limit)
