from contextlib import asynccontextmanager

from app.api.v1.execution import router as execution_router
from app.core.config import config
from app.core.database import engine
from app.models.execution import Execution  # Register the database model  # noqa: F401
from fastapi import APIRouter, FastAPI
from sqlmodel import SQLModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(title=config.app_name, lifespan=lifespan)

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(execution_router)

# Finally
app.include_router(api_v1)
