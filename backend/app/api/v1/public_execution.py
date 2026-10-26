import json
from collections.abc import Generator
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.config import config
from app.core.database import engine
from app.core.dependencies import get_rabbitmq_client
from app.core.rabbitmq import RabbitMQClient
from app.models.execution import Execution
from app.schemas.execution import (
    ExecutionCreate,
    ExecutionRead,
    ExecutionResultRead,
    ExecutionUpdate,
)

router = APIRouter(prefix="/public/executions", tags=["public-executions"])


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@router.post(
    "/",
    response_model=ExecutionRead,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_409_CONFLICT: {
            "description": "An execution with this ID already exists.",
        },
    },
)
async def create_execution(
    execution_data: ExecutionCreate,
    session: Session = Depends(get_session),  # noqa: B008
):
    execution = Execution(
        block_graph=execution_data.block_graph,
        name=execution_data.name,
        is_public=True,
    )

    session.add(execution)

    try:
        session.commit()
        session.refresh(execution)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An execution with this ID already exists: {execution.id!s}",
        ) from exc

    return execution


@router.patch(
    "/{execution_id}",
    response_model=ExecutionRead,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Execution not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
        status.HTTP_400_BAD_REQUEST: {"description": "Bad request."},
    },
)
def update_execution(
    execution_id: UUID,
    execution_data: ExecutionUpdate,
    session: Session = Depends(get_session),  # noqa: B008
):

    statement = select(Execution).where(
        Execution.id == execution_id,
        Execution.is_public == True,
    )
    execution = session.exec(statement).first()

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found.",
        )

    if execution_data.block_graph is None and execution_data.name is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of name or block_graph must be provided.",
        )

    if execution_data.name is not None:
        execution.name = execution_data.name

    if execution_data.block_graph is not None:
        execution.block_graph = execution_data.block_graph

    session.add(execution)

    try:
        session.commit()
        session.refresh(execution)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update execution: {execution.id!s}",
        ) from exc

    return execution


@router.get(
    "/{execution_id}",
    response_model=ExecutionRead,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Execution not found.",
        },
    },
)
def get_execution(
    execution_id: UUID,
    session: Session = Depends(get_session),  # noqa: B008
):
    statement = select(Execution).where(
        Execution.id == execution_id,
        Execution.is_public == True,
    )
    execution = session.exec(statement).first()

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found.",
        )

    return execution


@router.delete(
    "/{execution_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Execution not found.",
        },
    },
)
def delete_execution(
    execution_id: UUID,
    session: Session = Depends(get_session),  # noqa: B008
):
    statement = select(Execution).where(
        Execution.id == execution_id,
        Execution.is_public == True,
    )
    execution = session.exec(statement).first()

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found.",
        )

    session.delete(execution)
    session.commit()


@router.post(
    "/{execution_id}/run",
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Execution not found.",
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "Failed to publish execution to queue.",
        },
    },
)
async def run_execution(
    execution_id: UUID,
    session: Session = Depends(get_session),  # noqa: B008
    rabbitmq: RabbitMQClient = Depends(get_rabbitmq_client),  # noqa: B008
):
    statement = (
        select(Execution)
        .where(
            Execution.id == execution_id,
            Execution.is_public == True,
        )
        .with_for_update()
    )
    execution = session.exec(statement).first()

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found.",
        )

    execution.results = []
    session.add(execution)
    session.flush()

    try:
        await rabbitmq.publish_execution(execution.id)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to publish execution to queue.",
        ) from exc

    session.commit()

    return {
        "execution_id": str(execution.id),
        "message": "Successfully queued execution.",
    }


@router.get(
    "/{execution_id}/results/{result}",
    status_code=status.HTTP_200_OK,
    response_model=ExecutionResultRead,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Execution not found.",
        },
        status.HTTP_404_NOT_FOUND: {
            "description": "Result not found in execution.",
        },
    },
)
def get_execution_result(
    execution_id: UUID,
    result: str,
    session: Session = Depends(get_session),  # noqa: B008
):
    statement = select(Execution).where(
        Execution.id == execution_id,
        Execution.is_public == True,
    )
    execution = session.exec(statement).first()

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found.",
        )

    out = None
    for item in execution.results:
        if item.get("file") == result:
            out = item
            break

    if out is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found in execution.",
        )

    return out


@router.get(
    "/{execution_id}/results/{result}/claim",
    status_code=status.HTTP_200_OK,
    response_class=JSONResponse,
    response_model=None,
    responses={
        status.HTTP_200_OK: {
            "description": "Claimed result JSON.",
            "content": {"application/json": {}},
        },
        status.HTTP_404_NOT_FOUND: {
            "description": "Execution not found.",
        },
        status.HTTP_403_FORBIDDEN: {
            "description": "Result not available.",
        },
    },
)
def claim_execution_result(
    execution_id: UUID,
    result: str,
    session: Session = Depends(get_session),  # noqa: B008
) -> JSONResponse:
    statement = (
        select(Execution)
        .where(
            Execution.id == execution_id,
            Execution.is_public == True,
        )
        .with_for_update()
    )
    execution = session.exec(statement).first()

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found.",
        )

    out = None
    for item in execution.results:
        if isinstance(item, dict) and item.get("file") == result:
            out = item
            break

    if out is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found in execution.",
        )

    if out.get("status") != "AVAILABLE" or out.get("claimed") is True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Result not available.",
        )

    results_dir = (Path(config.working_dir) / str(execution_id) / "files").resolve()
    try:
        result_path = (results_dir / result).resolve(strict=True)
        result_path.relative_to(results_dir)
    except (OSError, RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found in execution.",
        ) from exc

    if not result_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found in execution.",
        )

    with result_path.open(encoding="utf-8") as result_file:
        result_contents = json.load(result_file)

    updated_result = {
        **out,
        "status": "CLAIMED",
        "claimed": True,
    }
    execution.results = [
        updated_result if item is out else item for item in execution.results
    ]
    session.add(execution)
    session.commit()

    return JSONResponse(content=result_contents)
