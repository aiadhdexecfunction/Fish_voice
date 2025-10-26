import asyncio
from typing import Dict
from fastapi import Body

from models import PomodoroRequest, Event, EventType, PomodoroPhase
from websocket import event_queue
from config import settings


# ===================== Pomodoro =====================
pomodoro_tasks: Dict[str, asyncio.Task] = {}


async def pomodoro_start(payload: PomodoroRequest):
    await pomodoro_stop(payload.user_id)
    task = asyncio.create_task(_run_pomodoro(payload))
    pomodoro_tasks[payload.user_id] = task
    return {"ok": True}


async def pomodoro_stop(user_id: str):
    t = pomodoro_tasks.pop(user_id, None)
    if t and not t.done():
        t.cancel()
        try:
            await t
        except asyncio.CancelledError:
            pass
    return {"ok": True}


async def _run_pomodoro(p: PomodoroRequest):
    for _ in range(p.cycles):
        # Focus starts
        await event_queue.put(Event(
            type=EventType.REMINDER_DUE, user_id=p.user_id,
            data={"phase": PomodoroPhase.FOCUS_START, "minutes": p.focus_min}
        ))
        await asyncio.sleep(p.focus_min * 60)

        # Break starts
        await event_queue.put(Event(
            type=EventType.REMINDER_DUE, user_id=p.user_id,
            data={"phase": PomodoroPhase.BREAK_START, "minutes": p.break_min}
        ))
        await asyncio.sleep(p.break_min * 60)

        # One cycle done
        await event_queue.put(Event(
            type=EventType.REMINDER_DUE, user_id=p.user_id,
            data={"phase": PomodoroPhase.CYCLE_END}
        ))
    # All cycles done
    await event_queue.put(Event(
        type=EventType.REMINDER_DUE, user_id=p.user_id,
        data={"phase": PomodoroPhase.ALL_DONE}
    ))
