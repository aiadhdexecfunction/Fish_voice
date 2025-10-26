from typing import Optional
from uuid import UUID, uuid4

from config import settings

# --- Composio (optional) ---
COMPOSIO_AVAILABLE = True
try:
    from composio import Composio
except Exception:
    COMPOSIO_AVAILABLE = False


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


def initiate_gmail_connection(user_id: Optional[str] = None):
    """Start Gmail OAuth via Composio"""
    if not COMPOSIO_AVAILABLE:
        return {"error": "composio_not_installed"}
    if not composio_client:
        return {"error": "composio_not_configured"}
    if not settings.COMPOSIO_GMAIL_AUTH_CONFIG:
        return {"error": "missing_gmail_auth_config"}

    user_uuid = _ensure_uuid(user_id)
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
        return {"error": "initiate_failed", "detail": str(e)}


def get_gmail_connection_status(connection_id: str):
    """Check Gmail connection status"""
    if not COMPOSIO_AVAILABLE:
        return {"error": "composio_not_installed"}
    if not composio_client:
        return {"error": "composio_not_configured"}
    if not connection_id:
        return {"error": "missing_connection_id"}

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
        return {"error": "get_status_failed", "detail": str(e)}


def get_composio_health():
    """Composio health check"""
    return {
        "available": COMPOSIO_AVAILABLE,
        "configured": bool(composio_client),
        "has_gmail_auth_config": bool(settings.COMPOSIO_GMAIL_AUTH_CONFIG),
    }
