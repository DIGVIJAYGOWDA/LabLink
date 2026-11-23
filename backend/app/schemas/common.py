from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    """Base model: snake_case in Python, camelCase in JSON (matches the frontend types)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ErrorDetail(ApiModel):
    field: str | None = None
    message: str


class ErrorBody(ApiModel):
    code: str
    message: str
    details: list[ErrorDetail] = []


class ErrorResponse(ApiModel):
    error: ErrorBody
