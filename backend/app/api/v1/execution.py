from collections.abc import Generator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.api.v1.user import current_active_user
from app.core.database import engine
from app.core.dependencies import get_rabbitmq_client
from app.core.rabbitmq import RabbitMQClient
from app.models.execution import Execution
from app.models.user import User
from app.schemas.execution import ExecutionCreate, ExecutionRead, ExecutionUpdate

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
    },
)
async def create_execution(
    execution_data: ExecutionCreate,
    session: Session = Depends(get_session),  # noqa: B008
    user: User = Depends(current_active_user),  # noqa: B008
):
    execution = Execution(
        block_graph=execution_data.block_graph,
        name=execution_data.name,
        user_id=user.id,
        is_public=False,
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
    user: User = Depends(current_active_user),  # noqa: B008
):

    statement = select(Execution).where(
        Execution.id == execution_id,
        Execution.user_id == user.id,
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


@router.get("/", response_model=list[ExecutionRead])
def get_executions(
    session: Session = Depends(get_session),  # noqa: B008
    user: User = Depends(current_active_user),  # noqa: B008
):
    statement = select(Execution).where(Execution.user_id == user.id)
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
    user: User = Depends(current_active_user),  # noqa: B008
):
    statement = select(Execution).where(
        Execution.id == execution_id,
        Execution.user_id == user.id,
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
    user: User = Depends(current_active_user),  # noqa: B008
):
    statement = select(Execution).where(
        Execution.id == execution_id,
        Execution.user_id == user.id,
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
    user: User = Depends(current_active_user),  # noqa: B008
    rabbitmq: RabbitMQClient = Depends(get_rabbitmq_client),  # noqa: B008
):
    statement = select(Execution).where(
        Execution.id == execution_id,
        Execution.user_id == user.id,
    )
    execution = session.exec(statement).first()

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found.",
        )

    try:
        await rabbitmq.publish_execution(execution.id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to publish execution to queue.",
        ) from exc

    return {
        "execution_id": str(execution.id),
        "message": "Successfully queued execution to run.",
    }
