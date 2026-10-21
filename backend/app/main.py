from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.api.v1.execution import router as execution_router
from app.api.v1.public_execution import router as public_execution_router
from app.api.v1.user import auth_router, register_router, users_router
from app.api.v1.websockets import ws_router
from app.core.config import config
from app.core.database import engine
from app.core.rabbitmq import RabbitMQClient, handle_log, handle_result
from app.models.execution import Execution  # Register the database model  # noqa: F401
from app.models.user import User  # Register the database model  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the database tables
    SQLModel.metadata.create_all(engine)

    # Create the RabbitMQ client
    mqclient = RabbitMQClient()
    await mqclient.connect()
    app.state.mqclient = mqclient

    try:
        await mqclient.consume(mqclient.log_queue, handle_log)
        await mqclient.consume(mqclient.result_queue, handle_result)
        yield
    finally:
        await mqclient.close()


app = FastAPI(title=config.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(execution_router)
api_v1.include_router(public_execution_router)
api_v1.include_router(ws_router)
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
