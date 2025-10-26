from fastapi import APIRouter

from fish_audio import FISH_MODE

router = APIRouter(tags=["health"])


@router.get("/healthz")
def healthz():
    mode = "FishSDK" if FISH_MODE == "sdk" else "FishREST"
    return {"ok": True, "voice_backend": mode}
