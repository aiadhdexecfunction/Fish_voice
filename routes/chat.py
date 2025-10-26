from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models import ChatIn, UserPrefs
from personalities import get_personality
from letta_integration import letta_generate_single, generate_fallback_response
from websocket import ensure_user_has_agent, schedule_followup, cancel_followup
from database import get_account
from config import settings
from shared_state import user_prefs

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/send")
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
        print(f"[DEBUG] Letta response: '{reply}', agent_id: {agent_id}")

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
