from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse

from models import SayIn
from fish_audio import fish_tts_stream, fish_asr
from database import get_account
from personalities import get_personality, PERSONALITIES
from models import UserPrefs
from shared_state import user_prefs

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/say", summary="Text-to-speech (streams mp3/wav)")
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


@router.post("/asr", summary="Speech-to-text (upload audio)")
async def voice_asr(file: UploadFile = File(...), language: str = "en"):
    audio_bytes = await file.read()
    res = fish_asr(audio_bytes, language)
    return JSONResponse(res)
