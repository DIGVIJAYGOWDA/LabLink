from typing import Annotated

from fastapi import Depends

from app.repositories import Repositories, get_repositories
from app.schemas.common import ErrorResponse

RepoDep = Annotated[Repositories, Depends(get_repositories)]


def error_responses(*codes: int) -> dict:
    """OpenAPI docs for the shared error envelope."""
    return {code: {"model": ErrorResponse} for code in codes}
