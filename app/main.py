from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from sqlmodel import SQLModel

from app.api.v1.execution import router as execution_router
from app.api.v1.user import auth_router, register_router, users_router
from app.core.config import config
from app.core.database import engine
from app.models.execution import Execution  # Register the database model  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(title=config.app_name, lifespan=lifespan)

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(execution_router)
api_v1.include_router(
    auth_router,
    prefix="/auth/jwt",
    tags=["auth"],
)

api_v1.include_router(
    register_router,
    prefix="/auth",
    tags=["auth"],
)

api_v1.include_router(
    users_router,
    prefix="/users",
    tags=["users"],
)


# Finally
app.include_router(api_v1)
