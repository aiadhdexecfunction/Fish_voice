from typing import Optional
import requests  # REST fallback

from config import settings

# ===================== Try Fish SDK (fallback to REST if import fails) =====================
FISH_MODE = "rest"
try:
    from fish_audio_sdk import Session, TTSRequest, ASRRequest, Prosody  # type: ignore
    FISH_MODE = "sdk"
except Exception:
    FISH_MODE = "rest"


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
