import os
import asyncio
import hashlib
import hmac
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Dict, Optional, Set
from dataclasses import dataclass

from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, Body
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from pydantic import BaseModel
from uuid import UUID, uuid4

# --- Composio (optional) ---
COMPOSIO_AVAILABLE = True
try:
    from composio import Composio
except Exception:
    COMPOSIO_AVAILABLE = False

import requests  # REST fallback


# ===================== Try Fish SDK (fallback to REST if import fails) =====================
FISH_MODE = "rest"
try:
    from fish_audio_sdk import Session, TTSRequest, ASRRequest, Prosody  # type: ignore
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

    # Composio (Gmail)
    COMPOSIO_API_KEY: Optional[str] = None
    COMPOSIO_GMAIL_AUTH_CONFIG: Optional[str] = None  


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
def fish_tts_stream(
    text: str,
    fmt: str = "mp3",
    reference_id: Optional[str] = None,
    speed: float = 1.0,
    volume: int = 0,
    latency: str = "balanced",
    temperature: float = 0.7,
    top_p: float = 0.7,
):
    """Yield an audio byte stream for TTS."""
    if FISH_MODE == "sdk":
        # SDK mode
        try:
            session = Session(settings.FISH_API_KEY)
            
            # Validate and clean parameters
            clean_reference_id = reference_id or settings.FISH_VOICE_REFERENCE_ID
            if not clean_reference_id:
                clean_reference_id = None  # Don't pass None explicitly
            
            # Validate format
            if fmt not in ["mp3", "wav"]:
                fmt = "mp3"
            
            # Validate latency
            if latency not in ["balanced", "low", "high"]:
                latency = "balanced"
            
            # Validate numeric parameters
            speed = max(0.1, min(3.0, speed))  # Clamp between 0.1 and 3.0
            volume = max(-100, min(100, volume))  # Clamp between -100 and 100
            temperature = max(0.0, min(1.0, temperature))  # Clamp between 0.0 and 1.0
            top_p = max(0.0, min(1.0, top_p))  # Clamp between 0.0 and 1.0
            
            # Build request parameters
            req_params = {
                "text": text,
                "format": fmt,
                "prosody": Prosody(speed=speed, volume=volume),
                "latency": latency,
                "temperature": temperature,
                "top_p": top_p,
            }
            
            # Only add reference_id if it's not None
            if clean_reference_id:
                req_params["reference_id"] = clean_reference_id
            
            req = TTSRequest(**req_params)
            gen = session.tts(req)
            for chunk in gen:
                yield chunk
                
        except Exception as e:
            print(f"[Fish TTS SDK Error] {e}")
            # Fallback to REST mode on SDK error
            pass
    
    # REST mode (either as fallback or primary)
    try:
        url = "https://api.fish.audio/v1/tts"
        headers = {
            "Authorization": f"Bearer {settings.FISH_API_KEY}",
            "Content-Type": "application/json",
        }
        
        # Validate format
        if fmt not in ["mp3", "wav"]:
            fmt = "mp3"
        
        payload = {
            "text": text, 
            "format": fmt,
            "model": settings.FISH_MODEL,
        }
        
        # Only add reference_id if it exists
        final_reference_id = reference_id or settings.FISH_VOICE_REFERENCE_ID
        if final_reference_id:
            payload["reference_id"] = final_reference_id
        
        with requests.post(url, headers=headers, json=payload, stream=True, timeout=120) as r:
            r.raise_for_status()
            for chunk in r.iter_content(65536):
                if chunk:
                    yield chunk
                    
    except Exception as e:
        print(f"[Fish TTS REST Error] {e}")
        # Return empty bytes as last resort
        yield b""

def fish_asr(audio_bytes: bytes, language: str = "en"):
    """Return ASR result (text, duration) using SDK or REST."""
    if FISH_MODE == "sdk":
        session = Session(settings.FISH_API_KEY)
        from fish_audio_sdk import ASRRequest  # type: ignore
        res = session.asr(ASRRequest(audio=audio_bytes, language=language))
        return {"text": res.text, "duration_ms": res.duration}
    else:
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
    letta: Optional[Letta] = Letta(base_url=settings.LETTA_BASE_URL)
elif settings.LETTA_API_KEY:
    letta = Letta(token=settings.LETTA_API_KEY)
else:
    letta = None

# ===================== Account storage =====================
DB_PATH = os.getenv("ACCOUNTS_DB_PATH", os.path.join(os.path.dirname(__file__), "accounts.db"))
PBKDF2_ITERATIONS = 100_000


@contextmanager
def db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db_connection() as conn:
        # Check if table exists and has the old schema
        cursor = conn.execute("PRAGMA table_info(accounts)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if columns:  # Table exists
            # Check if letta_agent_id has NOT NULL constraint by trying to insert NULL
            try:
                conn.execute("INSERT INTO accounts (username, password_hash, letta_agent_id, created_at) VALUES (?, ?, ?, ?)", 
                           ("_test_migration", "dummy", None, "2024-01-01T00:00:00Z"))
                conn.execute("DELETE FROM accounts WHERE username = '_test_migration'")
            except sqlite3.IntegrityError:
                # Old schema with NOT NULL constraint - recreate table
                print("[INFO] Migrating accounts table to allow NULL letta_agent_id")
                conn.execute("CREATE TABLE accounts_new AS SELECT * FROM accounts")
                conn.execute("DROP TABLE accounts")
                conn.execute("ALTER TABLE accounts_new RENAME TO accounts")
        
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                voice_model TEXT,
                letta_agent_id TEXT,
                created_at TEXT NOT NULL
            )
            """
        )


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return f"{salt.hex()}:{hashed.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split(":", 1)
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(hash_hex)
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return hmac.compare_digest(candidate, expected)


def get_account(username: str) -> Optional[Dict[str, Optional[str]]]:
    with db_connection() as conn:
        row = conn.execute(
            "SELECT username, password_hash, voice_model, letta_agent_id FROM accounts WHERE username = ?",
            (username,),
        ).fetchone()
        if not row:
            return None
        return dict(row)


def create_letta_agent(username: str) -> Optional[str]:
    print(f"[DEBUG] create_letta_agent called for {username}, letta configured: {letta is not None}")
    if not letta:
        print(f"[WARNING] Letta is not configured, skipping agent creation for {username}")
        return None
    try:
        print(f"[DEBUG] Attempting to create Letta agent for {username}")
        # Try different model formats that Letta might expect
        model_options = ["openai/o4-mini", "openai/gpt-4o-mini", "gpt-4o-mini", "o4-mini"]
        agent = None
        
        for model in model_options:
            try:
                print(f"[DEBUG] Trying model: {model}")
                agent = letta.agents.create(name=f"{username}-agent", model=model)
                print(f"[DEBUG] Success with model: {model}")
                break
            except Exception as e:
                print(f"[DEBUG] Failed with model {model}: {e}")
                continue
        
        if not agent:
            raise Exception("All model formats failed")
        print(f"[DEBUG] Agent created: {agent}")
        agent_id = getattr(agent, "id", None)
        print(f"[DEBUG] Agent ID extracted: {agent_id}")
        if not agent_id:
            print(f"[WARNING] Failed to create Letta agent for {username} - no ID returned")
            return None
        print(f"[DEBUG] Successfully created Letta agent {agent_id} for {username}")
        return agent_id
    except Exception as e:
        print(f"[ERROR] Exception creating Letta agent for {username}: {e}")
        import traceback
        traceback.print_exc()
        return None


def store_account(username: str, password: str, voice_model: Optional[str]) -> Dict[str, Optional[str]]:
    agent_id = create_letta_agent(username)
    password_hash = hash_password(password)
    created_at = datetime.now(timezone.utc).isoformat()
    preferred_voice = voice_model or settings.FISH_VOICE_REFERENCE_ID
    try:
        with db_connection() as conn:
            conn.execute(
                "INSERT INTO accounts (username, password_hash, voice_model, letta_agent_id, created_at) VALUES (?, ?, ?, ?, ?)",
                (username, password_hash, preferred_voice, agent_id, created_at),
            )
    except sqlite3.IntegrityError:
        if letta and agent_id:
            try:
                letta.agents.delete(agent_id)
            except Exception:
                pass
        raise
    user_prefs.setdefault(username, UserPrefs())
    return {"username": username, "voice_model": preferred_voice, "letta_agent_id": agent_id}


init_db()

def letta_generate_single(
    content: str,
    personality: Optional[Personality] = None,
    agent_id: Optional[str] = None,
) -> str:
    """
    Send a single user message to Letta, return the assistant's text (STATEFUL pattern).
    """
    print(f"[DEBUG] letta_generate_single called: agent_id={agent_id}, letta={letta is not None}")
    if not agent_id or not letta:
        print(f"[DEBUG] Returning empty string - agent_id: {agent_id}, letta: {letta is not None}")
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
        agent_id=agent_id,
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
    try:
        reference_id = payload.reference_id
        if not reference_id and payload.user_id:
            account = get_account(payload.user_id)
            if account and account.get("voice_model"):
                reference_id = account["voice_model"]
            else:
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
    except Exception as e:
        print(f"[Voice Say Error] {e}")
        # Return a simple error response
        return JSONResponse(
            {"error": "TTS generation failed", "detail": str(e)}, 
            status_code=500
        )

@app.post("/voice/asr", summary="Speech-to-text (upload audio)")
async def voice_asr(file: UploadFile = File(...), language: str = "en"):
    audio_bytes = await file.read()
    res = fish_asr(audio_bytes, language)
    return JSONResponse(res)

# ===================== Composio client =====================
composio_client = None
if COMPOSIO_AVAILABLE and settings.COMPOSIO_API_KEY:
    try:
        composio_client = Composio(api_key=settings.COMPOSIO_API_KEY)
        print("[Composio] client initialized")
    except Exception as e:
        print("[Composio] init failed:", e)

def _ensure_uuid(s: Optional[str]) -> str:
    """Composio 要求 user_id 为有效 UUID；没传或非法就生成一个。"""
    if s:
        try:
            UUID(s)
            return s
        except Exception:
            pass
    return str(uuid4())


# ===================== Composio Gmail integration =====================
class GmailConnectIn(BaseModel):
    user_id: Optional[str] = None  # 建议传入你自己的用户 UUID；不传则自动生成

@app.post("/integrations/gmail/initiate", summary="Start Gmail OAuth via Composio")
def composio_gmail_initiate(payload: GmailConnectIn):
    if not COMPOSIO_AVAILABLE:
        return JSONResponse({"error": "composio_not_installed"}, status_code=400)
    if not composio_client:
        return JSONResponse({"error": "composio_not_configured"}, status_code=400)
    if not settings.COMPOSIO_GMAIL_AUTH_CONFIG:
        return JSONResponse({"error": "missing_gmail_auth_config"}, status_code=400)

    user_uuid = _ensure_uuid(payload.user_id)
    try:
        req = composio_client.connected_accounts.initiate(
            user_id=user_uuid,
            auth_config_id=settings.COMPOSIO_GMAIL_AUTH_CONFIG,
        )
        # 返回重定向链接，前端/终端打开完成 Google 授权
        return {
            "ok": True,
            "user_id": user_uuid,
            "connection_id": req.id,
            "redirect_url": req.redirect_url,
            "status": getattr(req, "status", None),
        }
    except Exception as e:
        return JSONResponse({"error": "initiate_failed", "detail": str(e)}, status_code=500)


@app.get("/integrations/gmail/status", summary="Check Gmail connection status")
def composio_gmail_status(connection_id: str):
    if not COMPOSIO_AVAILABLE:
        return JSONResponse({"error": "composio_not_installed"}, status_code=400)
    if not composio_client:
        return JSONResponse({"error": "composio_not_configured"}, status_code=400)
    if not connection_id:
        return JSONResponse({"error": "missing_connection_id"}, status_code=400)

    try:
        acc = composio_client.connected_accounts.get(connection_id)
        # 常见状态：PENDING / CONNECTED / FAILED
        return {
            "ok": True,
            "connection_id": connection_id,
            "status": getattr(acc, "status", None),
            "provider": getattr(acc, "provider", None),
            "created_at": getattr(acc, "created_at", None),
        }
    except Exception as e:
        return JSONResponse({"error": "get_status_failed", "detail": str(e)}, status_code=500)


@app.get("/integrations/composio/health", summary="Composio health check")
def composio_health():
    return {
        "available": COMPOSIO_AVAILABLE,
        "configured": bool(composio_client),
        "has_gmail_auth_config": bool(settings.COMPOSIO_GMAIL_AUTH_CONFIG),
    }


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
    voice_enabled: bool = False
    personality_id: str = DEFAULT_PERSONALITY_ID

user_prefs: Dict[str, UserPrefs] = {}

@app.get("/prefs/{user_id}")
def get_prefs(user_id: str):
    prefs = user_prefs.get(user_id, UserPrefs())
    personality = get_personality(prefs.personality_id)
    account = get_account(user_id)
    return {
        "user_id": user_id,
        "voice_enabled": prefs.voice_enabled,
        "personality": {
            "id": personality.id,
            "title": personality.title,
            "description": personality.description,
        },
        "voice_model": account.get("voice_model") if account else None,
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


class AccountCreateIn(BaseModel):
    username: str
    password: str
    voice_model: Optional[str] = None


class AccountLoginIn(BaseModel):
    username: str
    password: str


class VoiceModelUpdateIn(BaseModel):
    voice_model: str


@app.post("/accounts/register")
def register_account(payload: AccountCreateIn):
    username = payload.username.strip()
    if not username or not payload.password:
        return JSONResponse({"error": "invalid_credentials"}, status_code=400)
    if get_account(username):
        return JSONResponse({"error": "username_taken"}, status_code=409)
    try:
        account = store_account(username, payload.password, payload.voice_model)
    except sqlite3.IntegrityError:
        return JSONResponse({"error": "username_taken"}, status_code=409)
    except Exception as exc:
        return JSONResponse({"error": "account_creation_failed", "detail": str(exc)}, status_code=500)
    return {"ok": True, **account}


@app.post("/accounts/login")
def login_account(payload: AccountLoginIn):
    username = payload.username.strip()
    if not username or not payload.password:
        return JSONResponse({"error": "invalid_credentials"}, status_code=400)
    account = get_account(username)
    if not account or not verify_password(payload.password, account["password_hash"]):
        return JSONResponse({"error": "invalid_credentials"}, status_code=401)
    user_prefs.setdefault(username, UserPrefs())
    return {
        "ok": True,
        "username": account["username"],
        "voice_model": account.get("voice_model"),
        "letta_agent_id": account.get("letta_agent_id"),
    }


@app.get("/accounts/{username}")
def get_account_details(username: str):
    account = get_account(username)
    if not account:
        return JSONResponse({"error": "not_found"}, status_code=404)
    return {
        "username": account["username"],
        "voice_model": account.get("voice_model"),
        "letta_agent_id": account.get("letta_agent_id"),
    }


@app.post("/accounts/{username}/voice-model")
def update_voice_model(username: str, payload: VoiceModelUpdateIn):
    account = get_account(username)
    if not account:
        return JSONResponse({"error": "not_found"}, status_code=404)
    voice_model = payload.voice_model.strip()
    if not voice_model:
        return JSONResponse({"error": "invalid_voice_model"}, status_code=400)
    with db_connection() as conn:
        conn.execute(
            "UPDATE accounts SET voice_model = ? WHERE username = ?",
            (voice_model, username),
        )
    return {"ok": True, "username": username, "voice_model": voice_model}

# Track “awaiting user reply” deadlines
awaiting_reply: Dict[str, datetime] = {}

def schedule_followup(user_id: str, delay_sec: int):
    awaiting_reply[user_id] = datetime.now(timezone.utc) + timedelta(seconds=delay_sec)

def cancel_followup(user_id: str):
    if user_id in awaiting_reply:
        awaiting_reply.pop(user_id, None)

def generate_fallback_response(user_text: str, personality: Personality) -> str:
    """Generate varied fallback responses when Letta is unavailable."""
    import random
    
    # Simple keyword-based responses
    user_lower = user_text.lower()
    
    responses = []
    
    if any(word in user_lower for word in ["hello", "hi", "hey", "good morning", "good afternoon"]):
        responses = [
            "Hey there! Ready to tackle something today?",
            "Hi! What's on your mind?",
            "Hello! How can I help you stay focused?",
            "Hey! What's your priority right now?"
        ]
    elif any(word in user_lower for word in ["help", "stuck", "confused", "don't know"]):
        responses = [
            "Let's break this down into smaller pieces.",
            "What's the smallest step you can take right now?",
            "I'm here to help! What's feeling overwhelming?",
            "Let's tackle this one piece at a time."
        ]
    elif any(word in user_lower for word in ["tired", "exhausted", "burned out"]):
        responses = [
            "Take a moment to breathe. You're doing great.",
            "Rest is productive too. What would help you recharge?",
            "It's okay to slow down. What's one tiny thing you can do?",
            "You've been working hard. How about a short break?"
        ]
    elif any(word in user_lower for word in ["done", "finished", "completed", "accomplished"]):
        responses = [
            "Awesome! That's a win worth celebrating.",
            "Great job! What's next on your list?",
            "You did it! How does that feel?",
            "Nice work! Ready for the next challenge?"
        ]
    elif any(word in user_lower for word in ["focus", "concentrate", "work", "study"]):
        responses = [
            "Let's set up a focused work session.",
            "What's your main goal for this focus time?",
            "Ready to dive in? What's your first step?",
            "Let's create some momentum together."
        ]
    else:
        # Generic encouraging responses
        responses = [
            "I'm listening! Tell me more about what's on your mind.",
            "What's the most important thing right now?",
            "How can I support you today?",
            "What would help you feel more confident?",
            "Let's figure this out together.",
            "What's your next small step?"
        ]
    
    chosen_response = random.choice(responses)
    return apply_personality_text(personality, chosen_response)

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
        with db_connection() as conn:
            conn.execute(
                "UPDATE accounts SET letta_agent_id = ? WHERE username = ?",
                (new_agent_id, user_id)
            )
        print(f"[DEBUG] Updated account {user_id} with agent ID {new_agent_id}")
        return new_agent_id
    else:
        print(f"[DEBUG] Failed to create agent for {user_id}")
        return None

@app.post("/chat/send")
def chat_send(payload: ChatIn):
    """
    When the user speaks:
      1) cancel any pending follow-up,
      2) ensure user has a Letta agent (create if needed),
      3) ask Letta for a single reply,
      4) schedule a new one-shot follow-up if the user doesn't reply in time.
    """
    cancel_followup(payload.user_id)

    prefs = user_prefs.get(payload.user_id, UserPrefs())
    personality = get_personality(prefs.personality_id)
    
    # Ensure user has an agent (create if needed)
    agent_id = ensure_user_has_agent(payload.user_id)
    account = get_account(payload.user_id)

    # Ask Letta for a short English reply (fallback if Letta unavailable).
    prompt = payload.text.strip()
    reply = ""
    if prompt:
        reply = letta_generate_single(prompt, personality=personality, agent_id=agent_id) or ""
        print(f"[DEBUG] Letta response: '{reply}', agent_id: {agent_id}, letta_configured: {letta is not None}")

    if not reply:
        print(f"[DEBUG] Using fallback response for: '{prompt}'")
        reply = generate_fallback_response(prompt, personality)
        print(f"[DEBUG] Fallback response: '{reply}'")

    # One-shot follow-up timer
    schedule_followup(payload.user_id, settings.FOLLOWUP_DELAY_SEC)

    # Suggest voice playback to the client only if the user prefers voice
    return {
        "text": reply,
        "voice_suggested": bool(prefs.voice_enabled),
        "personality": personality.id,
        "voice_model": account.get("voice_model") if account else None,
    }

# ===================== Copy generation & Orchestrator =====================
def fallback_text_for(event: Event, personality: Personality) -> str:
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
