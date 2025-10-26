from typing import Dict, Optional
from models import Personality


DEFAULT_PERSONALITY_ID = "focus_friend"

PERSONALITIES: Dict[str, Personality] = {
    "focus_friend": Personality(
        id="focus_friend",
        title="Steady Focus Friend",
        description=(
            "A balanced accountability buddy who mixes cheer with calm, "
            "keeps momentum going, and offers tiny nudges."
        ),
        style_prompt=(
            "You are the Steady Focus Friend: a warm, supportive companion who blends gentle coaching "
            "with practical next steps. Keep replies short (~20 words), encouraging, and grounded."
        ),
        fallback_prefix="Alright, teammate!",
    ),
    "hype_buddy": Personality(
        id="hype_buddy",
        title="High-Energy Hype Buddy",
        description=(
            "A big-energy cheerleader who celebrates every win and keeps things upbeat and motivating."
        ),
        style_prompt=(
            "You are the High-Energy Hype Buddy: respond with enthusiastic, upbeat energy, lots of positive "
            "reinforcement, and motivational sparks. Stay concise (~20 words)."
        ),
        fallback_prefix="Let's go!",
        fallback_suffix="You've absolutely got this!",
    ),
    "zen_guide": Personality(
        id="zen_guide",
        title="Zen Focus Guide",
        description=(
            "A calm, mindful guide who keeps the user grounded with relaxed, reassuring language."
        ),
        style_prompt=(
            "You are the Zen Focus Guide: speak in a calm, centered tone with mindful encouragement. "
            "Keep messages brief (~20 words) and soothing."
        ),
        fallback_prefix="Deep breath—",
    ),
}


def get_personality(personality_id: Optional[str]) -> Personality:
    return PERSONALITIES.get(personality_id or "", PERSONALITIES[DEFAULT_PERSONALITY_ID])


def personality_style_prompt(personality: Personality, base_instruction: str) -> str:
    if not personality.style_prompt:
        return base_instruction
    return f"{personality.style_prompt.strip()} {base_instruction}".strip()


def apply_personality_text(personality: Personality, text: str) -> str:
    prefix = personality.fallback_prefix.strip()
    suffix = personality.fallback_suffix.strip()
    parts = [part for part in [prefix, text.strip(), suffix] if part]
    return " ".join(parts)
