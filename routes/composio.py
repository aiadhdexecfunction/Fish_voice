from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models import GmailConnectIn, CanvasConnectIn, GoogleCalConnectIn, GoogleDriveConnectIn
from composio_integration import (
    initiate_gmail_connection, get_gmail_connection_status,
    initiate_canvas_connection, get_canvas_connection_status,
    initiate_googlecalendar_connection, get_googlecalendar_connection_status,
    initiate_googledrive_connection, get_googledrive_connection_status,
    get_composio_health
)

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


@router.post("/canvas/initiate", summary="Start Canvas OAuth via Composio")
def composio_canvas_initiate(payload: CanvasConnectIn):
    result = initiate_canvas_connection(payload.user_id)
    if "error" in result:
        status_code = 400 if result["error"] in ["composio_not_installed", "composio_not_configured", "missing_canvas_auth_config"] else 500
        return JSONResponse(result, status_code=status_code)
    return result


@router.get("/canvas/status", summary="Check Canvas connection status")
def composio_canvas_status(connection_id: str):
    result = get_canvas_connection_status(connection_id)
    if "error" in result:
        status_code = 400 if result["error"] in ["composio_not_installed", "composio_not_configured", "missing_connection_id"] else 500
        return JSONResponse(result, status_code=status_code)
    return result


@router.post("/googlecalendar/initiate", summary="Start Google Calendar OAuth via Composio")
def composio_googlecalendar_initiate(payload: GoogleCalConnectIn):
    result = initiate_googlecalendar_connection(payload.user_id)
    if "error" in result:
        status_code = 400 if result["error"] in ["composio_not_installed", "composio_not_configured", "missing_googlecal_auth_config"] else 500
        return JSONResponse(result, status_code=status_code)
    return result


@router.get("/googlecalendar/status", summary="Check Google Calendar connection status")
def composio_googlecalendar_status(connection_id: str):
    result = get_googlecalendar_connection_status(connection_id)
    if "error" in result:
        status_code = 400 if result["error"] in ["composio_not_installed", "composio_not_configured", "missing_connection_id"] else 500
        return JSONResponse(result, status_code=status_code)
    return result


@router.post("/googledrive/initiate", summary="Start Google Drive OAuth via Composio")
def composio_googledrive_initiate(payload: GoogleDriveConnectIn):
    result = initiate_googledrive_connection(payload.user_id)
    if "error" in result:
        status_code = 400 if result["error"] in ["composio_not_installed", "composio_not_configured", "missing_googledrive_auth_config"] else 500
        return JSONResponse(result, status_code=status_code)
    return result


@router.get("/googledrive/status", summary="Check Google Drive connection status")
def composio_googledrive_status(connection_id: str):
    result = get_googledrive_connection_status(connection_id)
    if "error" in result:
        status_code = 400 if result["error"] in ["composio_not_installed", "composio_not_configured", "missing_connection_id"] else 500
        return JSONResponse(result, status_code=status_code)
    return result
