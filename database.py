import os
import hashlib
import hmac
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Dict, Optional

from config import settings


# ===================== Account storage =====================
DB_PATH = os.getenv("ACCOUNTS_DB_PATH", os.path.join(os.path.dirname(__file__), "accounts.db"))
PBKDF2_ITERATIONS = 100_000


@contextmanager
def db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db_connection() as conn:
        # Check if table exists and has the old schema
        cursor = conn.execute("PRAGMA table_info(accounts)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if columns:  # Table exists
            # Check if letta_agent_id has NOT NULL constraint by trying to insert NULL
            try:
                conn.execute("INSERT INTO accounts (username, password_hash, letta_agent_id, created_at) VALUES (?, ?, ?, ?)", 
                           ("_test_migration", "dummy", None, "2024-01-01T00:00:00Z"))
                conn.execute("DELETE FROM accounts WHERE username = '_test_migration'")
            except sqlite3.IntegrityError:
                # Old schema with NOT NULL constraint - recreate table
                print("[INFO] Migrating accounts table to allow NULL letta_agent_id")
                conn.execute("CREATE TABLE accounts_new AS SELECT * FROM accounts")
                conn.execute("DROP TABLE accounts")
                conn.execute("ALTER TABLE accounts_new RENAME TO accounts")
        
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                voice_model TEXT,
                letta_agent_id TEXT,
                created_at TEXT NOT NULL
            )
            """
        )


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return f"{salt.hex()}:{hashed.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split(":", 1)
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(hash_hex)
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return hmac.compare_digest(candidate, expected)


def get_account(username: str) -> Optional[Dict[str, Optional[str]]]:
    with db_connection() as conn:
        row = conn.execute(
            "SELECT username, password_hash, voice_model, letta_agent_id FROM accounts WHERE username = ?",
            (username,),
        ).fetchone()
        if not row:
            return None
        return dict(row)


def store_account(username: str, password: str, voice_model: Optional[str], agent_id: Optional[str] = None) -> Dict[str, Optional[str]]:
    password_hash = hash_password(password)
    created_at = datetime.now(timezone.utc).isoformat()
    preferred_voice = voice_model or settings.FISH_VOICE_REFERENCE_ID
    try:
        with db_connection() as conn:
            conn.execute(
                "INSERT INTO accounts (username, password_hash, voice_model, letta_agent_id, created_at) VALUES (?, ?, ?, ?, ?)",
                (username, password_hash, preferred_voice, agent_id, created_at),
            )
    except sqlite3.IntegrityError:
        raise
    return {"username": username, "voice_model": preferred_voice, "letta_agent_id": agent_id}


def update_account_agent_id(username: str, agent_id: str) -> None:
    with db_connection() as conn:
        conn.execute(
            "UPDATE accounts SET letta_agent_id = ? WHERE username = ?",
            (agent_id, username)
        )


def update_account_voice_model(username: str, voice_model: str) -> None:
    with db_connection() as conn:
        conn.execute(
            "UPDATE accounts SET voice_model = ? WHERE username = ?",
            (voice_model, username),
        )