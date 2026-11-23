from fastapi import APIRouter

from app.api.routes import assistant, bookings, conflicts, dashboard, health, resources

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(resources.router)
api_router.include_router(bookings.router)
api_router.include_router(conflicts.router)
api_router.include_router(dashboard.router)
api_router.include_router(assistant.router)
