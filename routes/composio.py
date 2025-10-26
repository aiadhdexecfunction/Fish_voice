from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models import GmailConnectIn
from composio_integration import initiate_gmail_connection, get_gmail_connection_status, get_composio_health

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.post("/gmail/initiate", summary="Start Gmail OAuth via Composio")
def composio_gmail_initiate(payload: GmailConnectIn):
    result = initiate_gmail_connection(payload.user_id)
    if "error" in result:
        status_code = 400 if result["error"] in ["composio_not_installed", "composio_not_configured", "missing_gmail_auth_config"] else 500
        return JSONResponse(result, status_code=status_code)
    return result


@router.get("/gmail/status", summary="Check Gmail connection status")
def composio_gmail_status(connection_id: str):
    result = get_gmail_connection_status(connection_id)
    if "error" in result:
        status_code = 400 if result["error"] in ["composio_not_installed", "composio_not_configured", "missing_connection_id"] else 500
        return JSONResponse(result, status_code=status_code)
    return result


@router.get("/composio/health", summary="Composio health check")
def composio_health():
    return get_composio_health()
