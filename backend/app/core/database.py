from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlmodel import create_engine

from .config import config, logger

engine = create_engine(config.pgurl)
logger.info(f"Connected to postgres via URL: {config.pgurl}")

# Async stuff below ------------


class Base(DeclarativeBase):
    pass


async_engine = create_async_engine(
    config.pgurl.replace(
        "postgresql://",
        "postgresql+asyncpg://",
        1,
    ),
)

async_session_maker = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
