import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect

from models import Event, EventType, PomodoroPhase, UserPrefs
from personalities import get_personality, apply_personality_text, personality_style_prompt
from letta_integration import letta_generate_single, generate_fallback_response, create_letta_agent
from database import get_account, update_account_agent_id
from shared_state import user_prefs


# ===================== Events & WebSocket =====================
event_queue: "asyncio.Queue[Event]" = asyncio.Queue()


class WSManager:
    def __init__(self) -> None:
        self._rooms: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self._rooms.setdefault(user_id, set()).add(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id in self._rooms and ws in self._rooms[user_id]:
            self._rooms[user_id].remove(ws)
            if not self._rooms[user_id]:
                del self._rooms[user_id]

    async def send_json(self, user_id: str, message: dict):
        conns = self._rooms.get(user_id, set())
        for ws in list(conns):
            try:
                await ws.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(user_id, ws)
            except Exception:
                self.disconnect(user_id, ws)


ws_manager = WSManager()


# Track "awaiting user reply" deadlines
awaiting_reply: Dict[str, datetime] = {}


def schedule_followup(user_id: str, delay_sec: int):
    awaiting_reply[user_id] = datetime.now(timezone.utc) + timedelta(seconds=delay_sec)


def cancel_followup(user_id: str):
    if user_id in awaiting_reply:
        awaiting_reply.pop(user_id, None)


def ensure_user_has_agent(user_id: str) -> Optional[str]:
    """Ensure user has a Letta agent, create one if needed."""
    account = get_account(user_id)
    if not account:
        return None
    
    agent_id = account.get("letta_agent_id")
    if agent_id:
        return agent_id
    
    # User doesn't have an agent, try to create one
    print(f"[DEBUG] User {user_id} has no agent, attempting to create one")
    new_agent_id = create_letta_agent(user_id)
    
    if new_agent_id:
        # Update the account with the new agent ID
        update_account_agent_id(user_id, new_agent_id)
        print(f"[DEBUG] Updated account {user_id} with agent ID {new_agent_id}")
        return new_agent_id
    else:
        print(f"[DEBUG] Failed to create agent for {user_id}")
        return None


def fallback_text_for(event: Event, personality) -> str:
    if event.type == EventType.REMINDER_DUE:
        phase = event.data.get("phase")
        minutes = event.data.get("minutes")
        if phase == PomodoroPhase.FOCUS_START:
            base = f"Starting a {minutes}-minute focus block—let's do this!"
        elif phase == PomodoroPhase.BREAK_START:
            base = f"Break time for {minutes} minutes—water and a quick stretch!"
        elif phase == PomodoroPhase.CYCLE_END:
            base = "That round's done. Start another?"
        else:
            base = "All pomodoros done for today. Great job!"
    elif event.type == EventType.MSG_FOLLOWUP:
        base = "Hey, still here—how's it going? Want a tiny 5‑minute next step?"
    else:
        base = "You've got this!"
    return apply_personality_text(personality, base)


async def generate_text_for_event(event: Event) -> str:
    prefs = user_prefs.get(event.user_id, UserPrefs())
    personality = get_personality(prefs.personality_id)

    # Ensure user has an agent (create if needed)
    agent_id = ensure_user_has_agent(event.user_id)
    account = get_account(event.user_id)

    if not agent_id:
        return fallback_text_for(event, personality)

    if event.type == EventType.REMINDER_DUE:
        phase = event.data.get("phase", "")
        minutes = event.data.get("minutes")
        base = personality_style_prompt(
            personality,
            (
                "You are a supportive, ADHD‑friendly companion coach. "
                "Respond in ONE short, conversational English sentence (max ~20 words), friendly and positive."
            ),
        )
        if phase == PomodoroPhase.FOCUS_START:
            prompt = (
                f"{base} We're starting a {minutes}-minute focus block; give a kickoff encouragement, "
                "and mention you'll gently check in later if they don't reply."
            )
        elif phase == PomodoroPhase.BREAK_START:
            prompt = (
                f"{base} Focus just ended; starting a {minutes}-minute break—offer a quick relaxation tip."
            )
        elif phase == PomodoroPhase.CYCLE_END:
            prompt = (
                f"{base} This round is complete; give praise and ask if they want to continue."
            )
        else:
            prompt = f"{base} All pomodoros are done today; celebrate and offer a short wrap‑up tip."
    elif event.type == EventType.MSG_FOLLOWUP:
        base = personality_style_prompt(
            personality,
            (
                "You are a caring friend. In ONE brief English sentence (~20 words), "
                "lightly check on progress and suggest a tiny next step. Be empathetic and non‑pressuring."
            ),
        )
        prompt = f"{base} The user has not replied for a while."
    else:
        return fallback_text_for(event, personality)

    text = letta_generate_single(prompt, personality=personality, agent_id=agent_id).strip()
    return text or fallback_text_for(event, personality)


async def voice_orchestrator():
    """
    Consume events → generate one line of copy → dispatch via WS:
      - type='speak': client may fetch /voice/say and play audio (if voice is enabled)
      - type='chat' : text only
    """
    while True:
        event: Event = await event_queue.get()
        try:
            prefs = user_prefs.get(event.user_id, UserPrefs())
            personality = get_personality(prefs.personality_id)
            account = get_account(event.user_id)
            text = await generate_text_for_event(event)
            voice_reference = None
            if account and account.get("voice_model"):
                voice_reference = account["voice_model"]
            else:
                voice_reference = personality.voice_reference_id
            msg_type = "speak" if prefs.voice_enabled else "chat"
            await ws_manager.send_json(event.user_id, {
                "type": msg_type,
                "event": event.type.value,
                "text": text,
                "data": event.data,
                "personality": personality.id,
                "voice_reference_id": voice_reference,
            })
        except Exception as e:
            prefs = user_prefs.get(event.user_id, UserPrefs())
            personality = get_personality(prefs.personality_id)
            account = get_account(event.user_id)
            voice_reference = None
            if account and account.get("voice_model"):
                voice_reference = account["voice_model"]
            else:
                voice_reference = personality.voice_reference_id
            await ws_manager.send_json(event.user_id, {
                "type": "chat", "event": event.type.value,
                "text": fallback_text_for(event, personality),
                "data": event.data,
                "error": str(e),
                "personality": personality.id,
                "voice_reference_id": voice_reference,
            })
        finally:
            event_queue.task_done()


# ===================== No-reply follow-up scanner =====================
async def followup_scanner():
    """
    Every 10s: if a user's "awaiting reply" deadline has passed,
    trigger one msg.followup event and clear the timer.
    """
    while True:
        await asyncio.sleep(10)
        now = datetime.now(timezone.utc)
        for user_id, due in list(awaiting_reply.items()):
            if now >= due:
                await event_queue.put(Event(type=EventType.MSG_FOLLOWUP, user_id=user_id, data={}))
                awaiting_reply.pop(user_id, None)
