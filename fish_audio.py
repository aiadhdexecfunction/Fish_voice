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
