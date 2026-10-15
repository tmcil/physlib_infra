from datetime import UTC, datetime
from enum import Enum
from uuid import UUID, uuid4

# from pydantic import BaseModel, Field
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
    status: ExecutionStatus = Field(default=ExecutionStatus.CREATED)
    block_config: dict = Field(default_factory=dict, sa_type=JSONB)
    block_graph: dict = Field(default_factory=dict, sa_type=JSONB)
