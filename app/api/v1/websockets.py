from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import logger

ws_router = APIRouter(prefix="/ws", tags=["Websockets"])


class ConnectionManager:
    def __init__(self):
        # One execution can have multiple connected frontend clients.
        self.active_connections: dict[UUID, set[WebSocket]] = {}

    async def connect(self, execution_id: UUID, websocket: WebSocket):
        await websocket.accept()

        self.active_connections.setdefault(execution_id, set()).add(
            websocket
        )

    def disconnect(self, execution_id: UUID, websocket: WebSocket):
        connections = self.active_connections.get(execution_id)

        if connections is None:
            return

        connections.discard(websocket)

        if not connections:
            del self.active_connections[execution_id]

    async def send_to_execution(self, execution_id: UUID, event: dict):
        connections = self.active_connections.get(execution_id)

        if not connections:
            logger.debug(
                "No WebSocket connected for execution: %s",
                execution_id,
            )
            return

        for websocket in list(connections):
            try:
                await websocket.send_json(event)
            except (WebSocketDisconnect, RuntimeError):
                self.disconnect(execution_id, websocket)


# Shared by the WebSocket endpoint and RabbitMQ handlers.
manager = ConnectionManager()


@ws_router.websocket("/{execution_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    execution_id: UUID,
):
    await manager.connect(execution_id, websocket)

    try:
        while True:
            # Keep the connection open and detect client disconnection.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(execution_id, websocket)
