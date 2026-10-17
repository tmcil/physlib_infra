from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import logger

ws_router = APIRouter(prefix="/ws", tags=["Websockets"])

"""
{
    "type": "log",
    "execution_id": "d4c1f138-f88c-4e3a-8b5e-0f9e2b6c1a2b",
    "message": "2026-10-17T17:16:35 INFO (__C) Successfully created TLE for: VANGUARD 1"
    
    OR

    "type": "result",
    "execution_id": "d4c1f138-f88c-4e3a-8b5e-0f9e2b6c1a2b",
    "message": "BLOCK_SGP4_00_d4c1f138f88c"
}
"""


@ws_router.websocket("/{execution_id}")
async def websocket_endpoint_logs(websocket: WebSocket, exection_id: UUID):
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
