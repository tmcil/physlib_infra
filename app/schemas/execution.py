from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.execution import ExecutionStatus


class ExecutionCreate(BaseModel):
    block_graph: dict
    block_config: dict


class ExecutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: ExecutionStatus
    created_at: datetime
    updated_at: datetime
    block_graph: dict
    block_config: dict
