import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import AppError, register_exception_handlers
from app.core.middleware import register_middleware
from app.repositories import get_repositories

settings = get_settings()

logging.basicConfig(level=settings.log_level.upper(), format="%(asctime)s %(levelname)s %(name)s: %(message)s")

logger = logging.getLogger("lablink")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Check the data store once at startup. Failures are logged, not fatal: requests then get a 503.
    try:
        repos = get_repositories()
        repos.resources.get("__startup_check__")
        logger.info("Data store ready (%s)", repos.backend)
    except AppError as exc:
        logger.error("Data store check failed: %s", exc.message)
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    version=settings.app_version,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

register_middleware(app, settings)
register_exception_handlers(app)
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=not settings.is_production)
