from typing import Optional
from letta_client import Letta  # per your Letta development guidelines

from config import settings
from models import Personality
from personalities import personality_style_prompt
from database import update_account_agent_id


# ===================== Letta client =====================
if settings.LETTA_BASE_URL:
    letta: Optional[Letta] = Letta(base_url=settings.LETTA_BASE_URL)
elif settings.LETTA_API_KEY:
    letta = Letta(token=settings.LETTA_API_KEY)
else:
    letta = None


def create_letta_agent(username: str) -> Optional[str]:
    print(f"[DEBUG] create_letta_agent called for {username}, letta configured: {letta is not None}")
    if not letta:
        print(f"[WARNING] Letta is not configured, skipping agent creation for {username}")
        return None
    try:
        print(f"[DEBUG] Attempting to create Letta agent for {username}")
        # Try different model formats that Letta might expect
        model_options = ["openai/o4-mini", "openai/gpt-4o-mini", "gpt-4o-mini", "o4-mini"]
        agent = None
        
        for model in model_options:
            try:
                print(f"[DEBUG] Trying model: {model}")
                agent = letta.agents.create(name=f"{username}-agent", model=model)
                print(f"[DEBUG] Success with model: {model}")
                break
            except Exception as e:
                print(f"[DEBUG] Failed with model {model}: {e}")
                continue
        
        if not agent:
            raise Exception("All model formats failed")
        print(f"[DEBUG] Agent created: {agent}")
        agent_id = getattr(agent, "id", None)
        print(f"[DEBUG] Agent ID extracted: {agent_id}")
        if not agent_id:
            print(f"[WARNING] Failed to create Letta agent for {username} - no ID returned")
            return None
        print(f"[DEBUG] Successfully created Letta agent {agent_id} for {username}")
        return agent_id
    except Exception as e:
        print(f"[ERROR] Exception creating Letta agent for {username}: {e}")
        import traceback
        traceback.print_exc()
        return None


def letta_generate_single(
    content: str,
    personality: Optional[Personality] = None,
    agent_id: Optional[str] = None,
) -> str:
    """
    Send a single user message to Letta, return the assistant's text (STATEFUL pattern).
    """
    print(f"[DEBUG] letta_generate_single called: agent_id={agent_id}, letta={letta is not None}")
    if not agent_id or not letta:
        print(f"[DEBUG] Returning empty string - agent_id: {agent_id}, letta: {letta is not None}")
        return ""  # allow fallback upstream
    prompt = content
    if personality:
        instruction = personality_style_prompt(
            personality,
            "Respond in that persona. Keep it warm, actionable, and under ~20 words.",
        )
        prompt = (
            f"{instruction}\n\nUser message: {content}\nAssistant:"
        )
    resp = letta.agents.messages.create(
        agent_id=agent_id,
        messages=[{"role": "user", "content": prompt}],
    )
    for msg in getattr(resp, "messages", []):
        if getattr(msg, "message_type", "") == "assistant_message":
            return (getattr(msg, "content", "") or "").strip()
    return ""


def generate_fallback_response(user_text: str, personality: Personality) -> str:
    """Generate varied fallback responses when Letta is unavailable."""
    import random
    
    # Simple keyword-based responses
    user_lower = user_text.lower()
    
    responses = []
    
    if any(word in user_lower for word in ["hello", "hi", "hey", "good morning", "good afternoon"]):
        responses = [
            "Hey there! Ready to tackle something today?",
            "Hi! What's on your mind?",
            "Hello! How can I help you stay focused?",
            "Hey! What's your priority right now?"
        ]
    elif any(word in user_lower for word in ["help", "stuck", "confused", "don't know"]):
        responses = [
            "Let's break this down into smaller pieces.",
            "What's the smallest step you can take right now?",
            "I'm here to help! What's feeling overwhelming?",
            "Let's tackle this one piece at a time."
        ]
    elif any(word in user_lower for word in ["tired", "exhausted", "burned out"]):
        responses = [
            "Take a moment to breathe. You're doing great.",
            "Rest is productive too. What would help you recharge?",
            "It's okay to slow down. What's one tiny thing you can do?",
            "You've been working hard. How about a short break?"
        ]
    elif any(word in user_lower for word in ["done", "finished", "completed", "accomplished"]):
        responses = [
            "Awesome! That's a win worth celebrating.",
            "Great job! What's next on your list?",
            "You did it! How does that feel?",
            "Nice work! Ready for the next challenge?"
        ]
    elif any(word in user_lower for word in ["focus", "concentrate", "work", "study"]):
        responses = [
            "Let's set up a focused work session.",
            "What's your main goal for this focus time?",
            "Ready to dive in? What's your first step?",
            "Let's create some momentum together."
        ]
    else:
        # Generic encouraging responses
        responses = [
            "I'm listening! Tell me more about what's on your mind.",
            "What's the most important thing right now?",
            "How can I support you today?",
            "What would help you feel more confident?",
            "Let's figure this out together.",
            "What's your next small step?"
        ]
    
    chosen_response = random.choice(responses)
    from personalities import apply_personality_text
    return apply_personality_text(personality, chosen_response)
