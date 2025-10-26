import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Fish Audio
    FISH_API_KEY: str
    FISH_MODEL: str = "s1"
    FISH_VOICE_REFERENCE_ID: Optional[str] = None

    # Letta
    LETTA_API_KEY: Optional[str] = None
    LETTA_BASE_URL: Optional[str] = None
    LETTA_AGENT_ID: Optional[str] = None

    # Composio (Gmail)
    COMPOSIO_API_KEY: Optional[str] = None
    COMPOSIO_GMAIL_AUTH_CONFIG: Optional[str] = None  
    COMPOSIO_CANVAS_AUTH_CONFIG: Optional[str] = None 
    COMPOSIO_GOOGLECAL_AUTH_CONFIG: Optional[str] = None 
    COMPOSIO_GOOGLEDRIVE_AUTH_CONFIG: Optional[str] = None

    # Product logic
    FOLLOWUP_DELAY_SEC: int = int(os.getenv("FOLLOWUP_DELAY_SEC", "600"))
    DEFAULT_FOCUS_MIN: int = int(os.getenv("DEFAULT_FOCUS_MIN", "25"))
    DEFAULT_BREAK_MIN: int = int(os.getenv("DEFAULT_BREAK_MIN", "5"))

    class Config:
        env_file = ".env"


settings = Settings()
