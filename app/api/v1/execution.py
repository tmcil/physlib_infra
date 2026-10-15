from collections.abc import Generator
from uuid import UUID

from app.core.database import engine
from app.models.execution import Execution
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

router = APIRouter(prefix="/executions", tags=["Executions"])


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@router.post(
    "/",
    response_model=Execution,
    status_code=status.HTTP_201_CREATED,
)
def create_execution(
    execution: Execution,
    session: Session = Depends(get_session),  # noqa: B008
):
    session.add(execution)
    session.commit()
    session.refresh(execution)
    return execution


@router.get("/", response_model=list[Execution])
def get_executions(
    session: Session = Depends(get_session),  # noqa: B008
):
    statement = select(Execution)
    return session.exec(statement).all()


@router.get("/{execution_id}", response_model=Execution)
def get_execution(
    execution_id: UUID,
    session: Session = Depends(get_session),  # noqa: B008
):
    execution = session.get(Execution, execution_id)

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    return execution


@router.delete(
    "/{execution_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_execution(
    execution_id: UUID,
    session: Session = Depends(get_session),  # noqa: B008
):
    execution = session.get(Execution, execution_id)

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    session.delete(execution)
    session.commit()
