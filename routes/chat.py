from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

from models import ChatIn, UserPrefs
from personalities import get_personality
from letta_integration import letta_generate_single, generate_fallback_response, letta
from websocket import ensure_user_has_agent, schedule_followup, cancel_followup
from database import get_account
from config import settings
from shared_state import user_prefs

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/send")
def chat_send(payload: ChatIn):
    """
    When the user speaks:
      1) cancel any pending follow-up,
      2) ensure user has a Letta agent (create if needed),
      3) ask Letta for a single reply,
      4) schedule a new one-shot follow-up if the user doesn't reply in time.
    """
    cancel_followup(payload.user_id)

    prefs = user_prefs.get(payload.user_id, UserPrefs())
    personality = get_personality(prefs.personality_id)
    
    # Ensure user has an agent (create if needed)
    agent_id = ensure_user_has_agent(payload.user_id)
    account = get_account(payload.user_id)

    # Ask Letta for a short English reply (fallback if Letta unavailable).
    prompt = payload.text.strip()
    reply = ""
    if prompt:
        reply = letta_generate_single(prompt, personality=personality, agent_id=agent_id) or ""
        print(f"[DEBUG] Letta response: '{reply}', agent_id: {agent_id}")

    if not reply:
        print(f"[DEBUG] Using fallback response for: '{prompt}'")
        reply = generate_fallback_response(prompt, personality)
        print(f"[DEBUG] Fallback response: '{reply}'")

    # One-shot follow-up timer
    schedule_followup(payload.user_id, settings.FOLLOWUP_DELAY_SEC)

    # Suggest voice playback to the client only if the user prefers voice
    return {
        "text": reply,
        "voice_suggested": bool(prefs.voice_enabled),
        "personality": personality.id,
        "voice_model": account.get("voice_model") if account else None,
    }

@router.get("/history/{user_id}")
def get_chat_history(
    user_id: str,
    limit: Optional[int] = 50,
    order: str = "desc"
):
    """
    Get chat history for a user from their Letta agent.
    """
    try:
        # Get user's agent ID
        account = get_account(user_id)
        if not account or not account.get("letta_agent_id"):
            return {"messages": [], "error": "No agent found for user"}
        
        agent_id = account["letta_agent_id"]
        
        # Get messages from Letta
        if not letta:
            return {"messages": [], "error": "Letta not configured"}
        
        try:
            # Use Letta client to get message history (without order parameter)
            response = letta.agents.messages.list(
                agent_id=agent_id,
                limit=limit
            )
            
            print(f"[DEBUG] Response type: {type(response)}")
            print(f"[DEBUG] Response: {response}")
            
            # Check if response is a list or an object with messages attribute
            if isinstance(response, list):
                message_list = response
            else:
                message_list = getattr(response, "messages", [])
            
            print(f"[DEBUG] Message list length: {len(message_list)}")
            
            messages = []
            for msg in message_list:
                message_type = getattr(msg, "message_type", "unknown")
                content = getattr(msg, "content", "")
                
                print(f"[DEBUG] Message type: {message_type}, content preview: {content[:100]}...")
                
                # Only include user and assistant messages, skip system/reasoning/tool messages
                if message_type in ["user_message", "assistant_message"]:
                    # For user messages, extract just the actual user message
                    if message_type == "user_message":
                        role = "user"
                        # Extract the actual user message from the formatted prompt
                        if "User message: " in content:
                            # Extract text after "User message: " and before any "Assistant:" marker
                            user_msg = content.split("User message: ")[-1].split("\nAssistant:")[0].strip()
                            display_content = user_msg
                        else:
                            display_content = content
                    elif message_type == "assistant_message":
                        role = "assistant"
                        display_content = content
                    else:
                        role = message_type
                        display_content = content
                    
                    messages.append({
                        "role": role,
                        "content": display_content,
                        "timestamp": getattr(msg, "created_at", None) or getattr(msg, "date", None),
                        "message_type": message_type
                    })
            
            print(f"[DEBUG] Filtered messages count: {len(messages)}")
            
            # Sort messages manually based on timestamp
            if order == "desc":
                messages.sort(key=lambda x: x["timestamp"] or "1970-01-01T00:00:00Z", reverse=True)
            else:  # asc
                messages.sort(key=lambda x: x["timestamp"] or "1970-01-01T00:00:00Z", reverse=False)
            
            return {
                "messages": messages,
                "agent_id": agent_id,
                "count": len(messages)
            }
            
        except Exception as e:
            print(f"[ERROR] Failed to fetch Letta messages: {e}")
            import traceback
            traceback.print_exc()
            return {"messages": [], "error": f"Failed to fetch messages: {str(e)}"}
            
    except Exception as e:
        print(f"[ERROR] Chat history error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")
