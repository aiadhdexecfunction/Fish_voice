from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from websocket import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/events/{user_id}")
async def ws_events(ws: WebSocket, user_id: str):
    await ws_manager.connect(user_id, ws)
    try:
        while True:
            # If your frontend sends ACKs or other signals, receive them here.
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, ws)
