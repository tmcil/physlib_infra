from collections.abc import Generator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.database import engine
from app.core.rabbitmq import mq_publish_execution
from app.models.execution import Execution
from app.schemas.execution import ExecutionCreate, ExecutionRead

router = APIRouter(prefix="/executions", tags=["Executions"])


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
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "Failed to publish execution to queue.",
        },
    },
)
def create_execution(
    execution_data: ExecutionCreate,
    session: Session = Depends(get_session),  # noqa: B008
):
    execution = Execution(
        block_graph=execution_data.block_graph, block_config=execution_data.block_config
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

    try:
        mq_publish_execution(execution.id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to publish execution to queue.",
        ) from exc

    return execution


@router.get("/", response_model=list[ExecutionRead])
def get_executions(
    session: Session = Depends(get_session),  # noqa: B008
):
    statement = select(Execution)
    return session.exec(statement).all()


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
    execution = session.get(Execution, execution_id)

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
    execution = session.get(Execution, execution_id)

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
def run_execution(
    execution_id: UUID,
    session: Session = Depends(get_session),  # noqa: B008
):

    execution = session.get(Execution, execution_id)

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found.",
        )

    try:
        mq_publish_execution(execution.id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to publish execution to queue.",
        ) from exc

    return {
        "execution_id": str(execution.id),
        "message": "Successfully queued execution to run.",
    }
