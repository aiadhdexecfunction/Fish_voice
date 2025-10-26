from dataclasses import dataclass
from enum import Enum
from typing import Optional
from pydantic import BaseModel


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


# ===================== User preferences =====================
class UserPrefs(BaseModel):
    voice_enabled: bool = False
    personality_id: str = "focus_friend"


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


# ===================== Composio Gmail integration =====================
class GmailConnectIn(BaseModel):
    user_id: Optional[str] = None  # 建议传入你自己的用户 UUID；不传则自动生成


# ===================== Pomodoro =====================
class PomodoroRequest(BaseModel):
    user_id: str
    focus_min: int = 25
    break_min: int = 5
    cycles: int = 1


# ===================== Chat (Letta) =====================
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


class VoiceToggleIn(BaseModel):
    enabled: bool


class PersonalitySetIn(BaseModel):
    personality_id: str
