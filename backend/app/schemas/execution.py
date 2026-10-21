from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.execution import ExecutionStatus


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
