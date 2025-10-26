from fastapi import APIRouter, Body

from models import PomodoroRequest
from pomodoro import pomodoro_start, pomodoro_stop

router = APIRouter(prefix="/pomodoro", tags=["pomodoro"])


@router.post("/start")
async def start_pomodoro(payload: PomodoroRequest):
    return await pomodoro_start(payload)


@router.post("/stop")
async def stop_pomodoro(user_id: str = Body(..., embed=True)):
    return await pomodoro_stop(user_id)
