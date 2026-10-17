import uuid
from collections.abc import AsyncGenerator

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.database import get_async_session
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate


async def get_user_db(
    session: AsyncSession = Depends(get_async_session),  # noqa: B008
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User)


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = config.jwt_auth_secret
    verification_token_secret = config.jwt_auth_secret

    async def on_after_register(
        self,
        user: User,
        request: Request | None = None,
    ):
        print(f"User {user.id} registered")


async def get_user_manager(
    user_db=Depends(get_user_db),  # noqa: B008
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


bearer_transport = BearerTransport(
    tokenUrl="/api/v1/auth/jwt/login",
)


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=config.jwt_auth_secret,
        lifetime_seconds=3600,
    )


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_backend],
)


current_active_user = fastapi_users.current_user(
    active=True,
)

current_verified_user = fastapi_users.current_user(
    active=True,
    verified=True,
)

auth_router = fastapi_users.get_auth_router(auth_backend)

register_router = fastapi_users.get_register_router(
    UserRead,
    UserCreate,
)

users_router = fastapi_users.get_users_router(
    UserRead,
    UserUpdate,
)
