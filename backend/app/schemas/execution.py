from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.execution import ExecutionResultStatus, ExecutionStatus


class ExecutionCreate(BaseModel):
    name: str
    block_graph: dict


class ExecutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    status: ExecutionStatus
    created_at: datetime
    updated_at: datetime
    block_graph: dict


class ExecutionUpdate(BaseModel):
    name: str | None = None
    block_graph: dict | None = None


class ExecutionResultRead(BaseModel):
    type: str
    status: ExecutionResultStatus
    claimed: bool
    expires_at: datetime
    file: str
