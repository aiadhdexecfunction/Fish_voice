import os
import asyncio
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Dict, Optional, Set
from dataclasses import dataclass

from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, Body
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from pydantic import BaseModel
import requests  # REST fallback

# ===================== Try Fish SDK (fallback to REST if import fails) =====================
FISH_MODE = "rest"
try:
    from fish_audio_sdk import Session, TTSRequest, ASRRequest, Prosody  # type: ignore
    from fish_audio_sdk.exceptions import HttpCodeErr  # <-- added for precise catch
    FISH_MODE = "sdk"
except Exception:
    FISH_MODE = "rest"

# ===================== Letta =====================
from letta_client import Letta  # per your Letta development guidelines

# ===================== Settings =====================
class Settings(BaseSettings):
    # Fish Audio
    FISH_API_KEY: str
    FISH_MODEL: str = "s1"
    FISH_VOICE_REFERENCE_ID: Optional[str] = None

    # Letta
    LETTA_API_KEY: Optional[str] = None
    LETTA_BASE_URL: Optional[str] = None
    LETTA_AGENT_ID: Optional[str] = None

    # Product logic
    FOLLOWUP_DELAY_SEC: int = int(os.getenv("FOLLOWUP_DELAY_SEC", "600"))
    DEFAULT_FOCUS_MIN: int = int(os.getenv("DEFAULT_FOCUS_MIN", "25"))
    DEFAULT_BREAK_MIN: int = int(os.getenv("DEFAULT_BREAK_MIN", "5"))

    class Config:
        env_file = ".env"

settings = Settings()

# ===================== Personalities =====================
@dataclass(frozen=True)
class Personality:
    id: str
    title: str
    description: str
    style_prompt: str
    voice_reference_id: Optional[str] = None
    fallback_prefix: str = ""
    fallback_suffix: str = ""


DEFAULT_PERSONALITY_ID = "focus_friend"

PERSONALITIES: Dict[str, Personality] = {
    "focus_friend": Personality(
        id="focus_friend",
        title="Steady Focus Friend",
        description=(
            "A balanced accountability buddy who mixes cheer with calm, "
            "keeps momentum going, and offers tiny nudges."
        ),
        style_prompt=(
            "You are the Steady Focus Friend: a warm, supportive companion who blends gentle coaching "
            "with practical next steps. Keep replies short (~20 words), encouraging, and grounded."
        ),
        fallback_prefix="Alright, teammate!",
    ),
    "hype_buddy": Personality(
        id="hype_buddy",
        title="High-Energy Hype Buddy",
        description=(
            "A big-energy cheerleader who celebrates every win and keeps things upbeat and motivating."
        ),
        style_prompt=(
            "You are the High-Energy Hype Buddy: respond with enthusiastic, upbeat energy, lots of positive "
            "reinforcement, and motivational sparks. Stay concise (~20 words)."
        ),
        fallback_prefix="Let's go!",
        fallback_suffix="You've absolutely got this!",
    ),
    "zen_guide": Personality(
        id="zen_guide",
        title="Zen Focus Guide",
        description=(
            "A calm, mindful guide who keeps the user grounded with relaxed, reassuring language."
        ),
        style_prompt=(
            "You are the Zen Focus Guide: speak in a calm, centered tone with mindful encouragement. "
            "Keep messages brief (~20 words) and soothing."
        ),
        fallback_prefix="Deep breath—",
    ),
}


def get_personality(personality_id: Optional[str]) -> Personality:
    return PERSONALITIES.get(personality_id or "", PERSONALITIES[DEFAULT_PERSONALITY_ID])


def personality_style_prompt(personality: Personality, base_instruction: str) -> str:
    if not personality.style_prompt:
        return base_instruction
    return f"{personality.style_prompt.strip()} {base_instruction}".strip()


def apply_personality_text(personality: Personality, text: str) -> str:
    prefix = personality.fallback_prefix.strip()
    suffix = personality.fallback_suffix.strip()
    parts = [part for part in [prefix, text.strip(), suffix] if part]
    return " ".join(parts)

# ===================== FastAPI & CORS =====================
app = FastAPI(title="BodyDouble — Letta + Fish Audio")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ===================== Fish Audio adapter layer =====================
def _fish_tts_stream_rest(text: str, fmt: str, reference_id: Optional[str]):
    """
    Minimal REST call with required 'model' header; stream audio chunks.
    """
    url = "https://api.fish.audio/v1/tts"
    headers = {
        "Authorization": f"Bearer {settings.FISH_API_KEY}",
        "Content-Type": "application/json",
        "model": settings.FISH_MODEL or "s1",  # REST requires model header
    }
    payload = {"text": text, "format": fmt}
    rid = reference_id or settings.FISH_VOICE_REFERENCE_ID
    if rid:
        payload["reference_id"] = rid

    with requests.post(url, headers=headers, json=payload, stream=True, timeout=120) as r:
        r.raise_for_status()
        for chunk in r.iter_content(65536):
            if chunk:
                yield chunk

def fish_tts_stream(
    text: str,
    fmt: str = "mp3",
    reference_id: Optional[str] = None,
    speed: float = 1.0,
    volume: int = 0,
    latency: str = "balanced",
    temperature: float = 0.7,  # kept in signature but NOT sent (minimize 400)
    top_p: float = 0.7,        # kept in signature but NOT sent
):
    """
    Minimal SDK path based on official docs:
      - Only pass text/format/reference_id/latency/Prosody (if non-default)
      - If SDK raises (400/401/422/others), fall back to REST with 'model' header
    """
    if FISH_MODE == "sdk":
        session = Session(settings.FISH_API_KEY)
        req_kwargs = {"text": text, "format": fmt, "latency": latency}
        rid = reference_id or settings.FISH_VOICE_REFERENCE_ID
        if rid:
            req_kwargs["reference_id"] = rid
        if speed != 1.0 or volume != 0:
            req_kwargs["prosody"] = Prosody(speed=speed, volume=volume)

        try:
            req = TTSRequest(**req_kwargs)
            for chunk in session.tts(req):
                yield chunk
            return
        except Exception as e:
            # Log briefly (optional)
            try:
                status = getattr(e, "status", None) or getattr(e, "status_code", None)
                print(f"[Fish SDK] TTS failed with status={status}, falling back to REST.")
            except Exception:
                print("[Fish SDK] TTS failed, falling back to REST.")
            # fall through to REST

    # REST fallback (minimal fields)
    yield from _fish_tts_stream_rest(text, fmt, reference_id)

def fish_asr(audio_bytes: bytes, language: str = "en"):
    """Return ASR result (text, duration) using SDK or REST."""
    if FISH_MODE == "sdk":
        session = Session(settings.FISH_API_KEY)
        try:
            res = session.asr(ASRRequest(audio=audio_bytes, language=language))
            return {"text": res.text, "duration_ms": res.duration}
        except Exception as e:
            print("[Fish SDK] ASR failed; falling back to REST.", e)

    url = "https://api.fish.audio/v1/asr"
    headers = {"Authorization": f"Bearer {settings.FISH_API_KEY}"}
    data = {"language": language, "ignore_timestamps": "true"}
    files = {"audio": ("audio.wav", audio_bytes, "application/octet-stream")}
    r = requests.post(url, headers=headers, data=data, files=files, timeout=120)
    r.raise_for_status()
    j = r.json()
    return {"text": j.get("text", ""), "duration_ms": int(j.get("duration", 0) * 1000) if "duration" in j else None}

# ===================== Letta client =====================
if settings.LETTA_BASE_URL:
    letta = Letta(base_url=settings.LETTA_BASE_URL)
else:
    letta = Letta(token=settings.LETTA_API_KEY)

def letta_generate_single(content: str, personality: Optional[Personality] = None) -> str:
    """
    Send a single user message to Letta, return the assistant's text (STATEFUL pattern).
    """
    if not settings.LETTA_AGENT_ID:
        return ""  # allow fallback upstream
    prompt = content
    if personality:
        instruction = personality_style_prompt(
            personality,
            "Respond in that persona. Keep it warm, actionable, and under ~20 words.",
        )
        prompt = (
            f"{instruction}\n\nUser message: {content}\nAssistant:"
        )
    resp = letta.agents.messages.create(
        agent_id=settings.LETTA_AGENT_ID,
        messages=[{"role": "user", "content": prompt}],
    )
    for msg in getattr(resp, "messages", []):
        if getattr(msg, "message_type", "") == "assistant_message":
            return (getattr(msg, "content", "") or "").strip()
    return ""

# ===================== Voice API =====================
class SayIn(BaseModel):
    text: str
    reference_id: Optional[str] = None
    speed: Optional[float] = 1.0
    volume: Optional[int] = 0
    latency: Optional[str] = "balanced"
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.7
    format: Optional[str] = "mp3"
    user_id: Optional[str] = None

@app.post("/voice/say", summary="Text-to-speech (streams mp3/wav)")
def voice_say(payload: SayIn):
    reference_id = payload.reference_id
    if not reference_id and payload.user_id:
        prefs = user_prefs.get(payload.user_id, UserPrefs())
        personality = get_personality(prefs.personality_id)
        reference_id = personality.voice_reference_id
    gen = fish_tts_stream(
        text=payload.text,
        fmt=payload.format or "mp3",
        reference_id=reference_id,
        speed=payload.speed or 1.0,
        volume=payload.volume or 0,
        latency=payload.latency or "balanced",
        temperature=payload.temperature or 0.7,
        top_p=payload.top_p or 0.7,
    )
    media_type = "audio/mpeg" if (payload.format or "mp3") == "mp3" else "audio/wav"
    return StreamingResponse(gen, media_type=media_type)

@app.post("/voice/asr", summary="Speech-to-text (upload audio)")
async def voice_asr(file: UploadFile = File(...), language: str = "en"):
    audio_bytes = await file.read()
    res = fish_asr(audio_bytes, language)
    return JSONResponse(res)

# (NEW) List voice models (SDK only)
@app.get("/voice/models")
def list_models(self_only: bool = True):
    if FISH_MODE != "sdk":
        return JSONResponse({"error": "SDK not available; cannot list models."}, status_code=400)
    s = Session(settings.FISH_API_KEY)
    models = s.list_models(self_only=self_only)
    return {"items": [{"id": m.id, "title": m.title} for m in models.items]}

# ===================== Events & WebSocket =====================
class EventType(str, Enum):
    REMINDER_DUE = "reminder.due"    # Pomodoro transitions / due reminders
    MSG_FOLLOWUP = "msg.followup"    # No reply for a while → gentle check-in

class PomodoroPhase(str, Enum):
    FOCUS_START = "focus_start"
    BREAK_START = "break_start"
    CYCLE_END = "cycle_end"
    ALL_DONE = "all_done"

class Event(BaseModel):
    type: EventType
    user_id: str
    data: dict = {}

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

@app.websocket("/ws/events/{user_id}")
async def ws_events(ws: WebSocket, user_id: str):
    await ws_manager.connect(user_id, ws)
    try:
        while True:
            # If your frontend sends ACKs or other signals, receive them here.
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, ws)

# ===================== User preferences (Voice toggle) =====================
class UserPrefs(BaseModel):
    voice_enabled: bool = True
    personality_id: str = DEFAULT_PERSONALITY_ID

user_prefs: Dict[str, UserPrefs] = {}

@app.get("/prefs/{user_id}")
def get_prefs(user_id: str):
    prefs = user_prefs.get(user_id, UserPrefs())
    personality = get_personality(prefs.personality_id)
    return {
        "user_id": user_id,
        "voice_enabled": prefs.voice_enabled,
        "personality": {
            "id": personality.id,
            "title": personality.title,
            "description": personality.description,
        },
    }

class VoiceToggleIn(BaseModel):
    enabled: bool

@app.post("/prefs/{user_id}/voice")
def set_voice_pref(user_id: str, payload: VoiceToggleIn):
    prefs = user_prefs.get(user_id, UserPrefs())
    prefs.voice_enabled = payload.enabled
    user_prefs[user_id] = prefs
    return {"ok": True, "user_id": user_id, "voice_enabled": prefs.voice_enabled}


class PersonalitySetIn(BaseModel):
    personality_id: str


@app.post("/prefs/{user_id}/personality")
def set_personality_pref(user_id: str, payload: PersonalitySetIn):
    if payload.personality_id not in PERSONALITIES:
        return JSONResponse(
            {"error": "unknown_personality", "available": list(PERSONALITIES.keys())},
            status_code=400,
        )
    prefs = user_prefs.get(user_id, UserPrefs())
    prefs.personality_id = payload.personality_id
    user_prefs[user_id] = prefs
    personality = get_personality(prefs.personality_id)
    return {
        "ok": True,
        "user_id": user_id,
        "personality": {
            "id": personality.id,
            "title": personality.title,
            "description": personality.description,
        },
    }


@app.get("/personalities")
def list_personalities():
    return {
        "items": [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
            }
            for p in PERSONALITIES.values()
        ]
    }

# ===================== Pomodoro =====================
class PomodoroRequest(BaseModel):
    user_id: str
    focus_min: int = settings.DEFAULT_FOCUS_MIN
    break_min: int = settings.DEFAULT_BREAK_MIN
    cycles: int = 1

pomodoro_tasks: Dict[str, asyncio.Task] = {}

@app.post("/pomodoro/start")
async def pomodoro_start(payload: PomodoroRequest):
    await pomodoro_stop(payload.user_id)
    task = asyncio.create_task(_run_pomodoro(payload))
    pomodoro_tasks[payload.user_id] = task
    return {"ok": True}

@app.post("/pomodoro/stop")
async def pomodoro_stop(user_id: str = Body(..., embed=True)):
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

# ===================== Chat (Letta) + no-reply follow-up =====================
class ChatIn(BaseModel):
    user_id: str
    text: str

# Track “awaiting user reply” deadlines
awaiting_reply: Dict[str, datetime] = {}

def schedule_followup(user_id: str, delay_sec: int):
    awaiting_reply[user_id] = datetime.now(timezone.utc) + timedelta(seconds=delay_sec)

def cancel_followup(user_id: str):
    if user_id in awaiting_reply:
        awaiting_reply.pop(user_id, None)

@app.post("/chat/send")
def chat_send(payload: ChatIn):
    """
    When the user speaks:
      1) cancel any pending follow-up,
      2) ask Letta for a single reply,
      3) schedule a new one-shot follow-up if the user doesn't reply in time.
    """
    cancel_followup(payload.user_id)

    prefs = user_prefs.get(payload.user_id, UserPrefs())
    personality = get_personality(prefs.personality_id)

    # Ask Letta for a short English reply (fallback if Letta unavailable).
    prompt = payload.text.strip()
    reply = ""
    if prompt:
        reply = letta_generate_single(prompt, personality=personality) or ""

    if not reply:
        reply = apply_personality_text(
            personality,
            "Got it—I’m here. Want me to break that into three small steps?",
        )

    # One-shot follow-up timer
    schedule_followup(payload.user_id, settings.FOLLOWUP_DELAY_SEC)

    # Suggest voice playback to the client only if the user prefers voice
    return {
        "text": reply,
        "voice_suggested": bool(prefs.voice_enabled),
        "personality": personality.id,
    }

# ===================== Copy generation & Orchestrator =====================
def fallback_text_for(event: Event, personality: Personality) -> str:
    if event.type == EventType.REMINDER_DUE:
        phase = event.data.get("phase")
        minutes = event.data.get("minutes")
        if phase == PomodoroPhase.FOCUS_START:
            base = f"Starting a {minutes}-minute focus block—let’s do this!"
        elif phase == PomodoroPhase.BREAK_START:
            base = f"Break time for {minutes} minutes—water and a quick stretch!"
        elif phase == PomodoroPhase.CYCLE_END:
            base = "That round’s done. Start another?"
        else:
            base = "All pomodoros done for today. Great job!"
    elif event.type == EventType.MSG_FOLLOWUP:
        base = "Hey, still here—how’s it going? Want a tiny 5‑minute next step?"
    else:
        base = "You’ve got this!"
    return apply_personality_text(personality, base)

async def generate_text_for_event(event: Event) -> str:
    prefs = user_prefs.get(event.user_id, UserPrefs())
    personality = get_personality(prefs.personality_id)

    if not settings.LETTA_AGENT_ID:
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
                f"{base} We’re starting a {minutes}-minute focus block; give a kickoff encouragement, "
                "and mention you’ll gently check in later if they don’t reply."
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

    text = letta_generate_single(prompt, personality=personality).strip()
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
            text = await generate_text_for_event(event)
            msg_type = "speak" if prefs.voice_enabled else "chat"
            await ws_manager.send_json(event.user_id, {
                "type": msg_type,
                "event": event.type.value,
                "text": text,
                "data": event.data,
                "personality": personality.id,
                "voice_reference_id": personality.voice_reference_id,
            })
        except Exception as e:
            prefs = user_prefs.get(event.user_id, UserPrefs())
            personality = get_personality(prefs.personality_id)
            await ws_manager.send_json(event.user_id, {
                "type": "chat", "event": event.type.value,
                "text": fallback_text_for(event, personality),
                "data": event.data,
                "error": str(e),
                "personality": personality.id,
                "voice_reference_id": personality.voice_reference_id,
            })
        finally:
            event_queue.task_done()

# ===================== No-reply follow-up scanner =====================
async def followup_scanner():
    """
    Every 10s: if a user’s “awaiting reply” deadline has passed,
    trigger one msg.followup event and clear the timer.
    """
    while True:
        await asyncio.sleep(10)
        now = datetime.now(timezone.utc)
        for user_id, due in list(awaiting_reply.items()):
            if now >= due:
                await event_queue.put(Event(type=EventType.MSG_FOLLOWUP, user_id=user_id, data={}))
                awaiting_reply.pop(user_id, None)

# ===================== Startup tasks =====================
@app.on_event("startup")
async def startup():
    asyncio.create_task(voice_orchestrator())
    asyncio.create_task(followup_scanner())

@app.get("/healthz")
def healthz():
    mode = "FishSDK" if FISH_MODE == "sdk" else "FishREST"
    return {"ok": True, "voice_backend": mode}
