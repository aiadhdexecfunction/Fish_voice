import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all route modules
from routes import voice, accounts, chat, preferences, pomodoro, composio, websocket, health

# Import core modules
from database import init_db
from websocket import voice_orchestrator, followup_scanner

# ===================== FastAPI & CORS =====================
app = FastAPI(title="BodyDouble — Letta + Fish Audio")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# Include all routers
app.include_router(voice.router)
app.include_router(accounts.router)
app.include_router(chat.router)
app.include_router(preferences.router)
app.include_router(pomodoro.router)
app.include_router(composio.router)
app.include_router(websocket.router)
app.include_router(health.router)

# Initialize database
init_db()

# ===================== Startup tasks =====================
@app.on_event("startup")
async def startup():
    # Start background tasks
    asyncio.create_task(voice_orchestrator())
    asyncio.create_task(followup_scanner())
