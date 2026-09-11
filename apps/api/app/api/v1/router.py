from fastapi import APIRouter
from app.api.v1.circuits import router as circuits_router
from app.api.v1.simulations import router as simulations_router
from app.api.v1.ai import router as ai_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(circuits_router)
api_v1_router.include_router(simulations_router)
api_v1_router.include_router(ai_router)
