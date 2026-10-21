from datetime import UTC, datetime
from enum import Enum
from uuid import UUID, uuid4

# from pydantic import BaseModel, Field
from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class ExecutionStatus(str, Enum):
    CREATED = "CREATED"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    FAILED = "FAILED"


class Execution(SQLModel, table=True):
    __tablename__ = "executions"  # pyright: ignore[reportAssignmentType]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    status: ExecutionStatus = Field(default=ExecutionStatus.CREATED)
    name: str = Field(default="", max_length=255)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "onupdate": func.now(),
            "server_default": func.now(),
        },
        nullable=False,
    )
    block_graph: dict = Field(default_factory=dict, sa_type=JSONB)
