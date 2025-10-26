from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models import VoiceToggleIn, PersonalitySetIn, UserPrefs
from personalities import get_personality, PERSONALITIES, DEFAULT_PERSONALITY_ID
from database import get_account
from shared_state import user_prefs

router = APIRouter(prefix="/prefs", tags=["preferences"])


@router.get("/personalities")
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


@router.get("/{user_id}")
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


@router.post("/{user_id}/voice")
def set_voice_pref(user_id: str, payload: VoiceToggleIn):
    prefs = user_prefs.get(user_id, UserPrefs())
    prefs.voice_enabled = payload.enabled
    user_prefs[user_id] = prefs
    return {"ok": True, "user_id": user_id, "voice_enabled": prefs.voice_enabled}


@router.post("/{user_id}/personality")
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
