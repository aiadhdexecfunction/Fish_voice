from fastapi import APIRouter
from fastapi.responses import JSONResponse
import sqlite3

from models import AccountCreateIn, AccountLoginIn, VoiceModelUpdateIn, UserPrefs
from database import get_account, store_account, verify_password, update_account_voice_model
from letta_integration import create_letta_agent
from shared_state import user_prefs

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("/register")
def register_account(payload: AccountCreateIn):
    username = payload.username.strip()
    if not username or not payload.password:
        return JSONResponse({"error": "invalid_credentials"}, status_code=400)
    if get_account(username):
        return JSONResponse({"error": "username_taken"}, status_code=409)
    try:
        agent_id = create_letta_agent(username)
        account = store_account(username, payload.password, payload.voice_model, agent_id)
    except sqlite3.IntegrityError:
        return JSONResponse({"error": "username_taken"}, status_code=409)
    except Exception as exc:
        return JSONResponse({"error": "account_creation_failed", "detail": str(exc)}, status_code=500)
    user_prefs.setdefault(username, UserPrefs())
    return {"ok": True, **account}


@router.post("/login")
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


@router.get("/{username}")
def get_account_details(username: str):
    account = get_account(username)
    if not account:
        return JSONResponse({"error": "not_found"}, status_code=404)
    return {
        "username": account["username"],
        "voice_model": account.get("voice_model"),
        "letta_agent_id": account.get("letta_agent_id"),
    }


@router.post("/{username}/voice-model")
def update_voice_model(username: str, payload: VoiceModelUpdateIn):
    account = get_account(username)
    if not account:
        return JSONResponse({"error": "not_found"}, status_code=404)
    voice_model = payload.voice_model.strip()
    if not voice_model:
        return JSONResponse({"error": "invalid_voice_model"}, status_code=400)
    update_account_voice_model(username, voice_model)
    return {"ok": True, "username": username, "voice_model": voice_model}
