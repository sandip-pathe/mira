"""Canonical, non-clinical V0.03 demo activities."""

from copy import deepcopy

CATALOG_VERSION = "0.03"

_CATALOG = {
    "task_reset_60s": {
        "presentation": {"pattern": "sort", "input": "next_step", "optional_timer": False},
        "id": "task_reset_60s", "title": "Task reset", "category": "action",
        "goal": "Choose one small next step.",
        "situation_fit": ["many tasks competing for attention", "unclear where to begin", "wants to make a task feel more manageable"],
        "summary": "Get the tasks out of your head, sort them, and choose one small next step.",
        "steps": ["Write what is taking up space.", "Sort or edit the list if you want.", "Choose one small next step, or stop here."],
        "duration_seconds": 60, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.03 neutral demo placeholder", "delivery_modes": ["software_guided", "real_world"],
        "completion_signal": "User chooses a next step or stops.", "personalization_signals": ["task_overwhelm", "prefers_structure"],
    },
    "pause_60s": {
        "presentation": {"pattern": "steps", "input": "none", "optional_timer": True},
        "id": "pause_60s", "title": "A short pause", "category": "regulation",
        "goal": "Pause before deciding what comes next.",
        "situation_fit": ["wants a brief pause", "transitioning between activities", "wants a moment before deciding what to do"],
        "summary": "Take a brief pause, then choose what you want to do next.",
        "steps": ["Pause what you are doing if comfortable.", "Notice one thing around you.", "Choose what you want to do next."],
        "duration_seconds": 60, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.02 neutral demo placeholder", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User completes, skips, or stops the pause.", "personalization_signals": ["wants_a_pause"],
    },
    "name_a_feeling": {
        "presentation": {"pattern": "steps", "input": "none", "optional_timer": False},
        "id": "name_a_feeling", "title": "Name the feeling", "category": "reflection",
        "goal": "Put a name to what is happening.",
        "situation_fit": ["unsure how they feel", "wants to reflect on the present moment", "wants to put an experience into words"],
        "summary": "Find a word that comes close to how this moment feels.",
        "steps": ["What word comes closest to how this feels?", "Would you like to say more, or leave it there?"],
        "duration_seconds": 60, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.03 neutral demo placeholder", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User names a feeling, reflects, or skips.", "personalization_signals": ["wants_to_understand_moment"],
    },
    "grounding": {
        "presentation": {"pattern": "steps", "input": "none", "optional_timer": False},
        "id": "grounding", "title": "Notice what is around you", "category": "regulation",
        "goal": "Shift attention to the present surroundings.",
        "situation_fit": ["wants a concrete present-moment prompt", "wants to notice their surroundings", "prefers a brief sensory exercise"],
        "summary": "Try a short, optional exercise noticing your surroundings.",
        "steps": ["Look around and name one thing you can see.", "Notice one thing you can hear or feel.", "Would you like to continue or stop here?"],
        "duration_seconds": 90, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.03 neutral demo placeholder", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User completes or stops the steps.", "personalization_signals": ["prefers_concrete_prompt"],
    },
    "brain_dump": {
        "presentation": {"pattern": "capture", "input": "draft", "optional_timer": False},
        "id": "brain_dump", "title": "Brain dump", "category": "reflection",
        "goal": "Get thoughts out without needing to organize them.",
        "situation_fit": ["thoughts feel jumbled", "wants to write freely", "has several thoughts they want to get down"],
        "summary": "Write whatever is taking up space. Sorting it is optional.",
        "steps": ["Write freely for a moment.", "Read it back only if you want.", "Choose whether to keep talking or pick one thing."],
        "duration_seconds": 120, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.03 neutral demo placeholder", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User finishes writing, chooses one thought, or stops.", "personalization_signals": ["prefers_writing", "thoughts_feel_jumbled"],
    },
    "tiny_next_step": {
        "presentation": {"pattern": "steps", "input": "next_step", "optional_timer": False},
        "id": "tiny_next_step", "title": "Choose a tiny next step", "category": "action",
        "goal": "Make one task easier to start.",
        "situation_fit": ["wants to begin a specific task", "a task feels hard to start", "wants to identify one manageable action"],
        "summary": "Pick one small action that feels possible now.",
        "steps": ["What is one thing you want to move forward?", "What is the smallest first step?", "Would you like to try it now or leave it for later?"],
        "duration_seconds": 60, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.03 neutral demo placeholder", "delivery_modes": ["software_guided", "real_world"],
        "completion_signal": "User chooses or tries a next step.", "personalization_signals": ["wants_to_start_task"],
    },
    "short_movement": {
        "presentation": {"pattern": "steps", "input": "none", "optional_timer": True},
        "id": "short_movement", "title": "Short movement break", "category": "action",
        "goal": "Try a brief, comfortable movement break.",
        "situation_fit": ["wants a movement break", "prefers an activity away from the screen", "has a comfortable opportunity to move"],
        "summary": "If it suits you, take a short walk or move in a comfortable way.",
        "steps": ["Choose a comfortable way to move, or skip this.", "Try it for a few minutes if you want.", "Come back when you are ready."],
        "duration_seconds": 300, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.03 neutral demo placeholder", "delivery_modes": ["real_world"],
        "completion_signal": "User returns, completes, or stops.", "personalization_signals": ["movement_preference"],
    },
    "sleep_wind_down": {
        "presentation": {"pattern": "steps", "input": "none", "optional_timer": False},
        "id": "sleep_wind_down", "title": "Wind down for rest", "category": "routine",
        "goal": "Choose one small step toward winding down.",
        "situation_fit": ["wants to wind down", "is preparing for rest", "wants to make the current moment quieter"],
        "summary": "Make a little space for rest with one optional, simple step.",
        "steps": ["What would make this moment a little quieter?", "Choose one small step that feels comfortable.", "You can stop or change the plan at any time."],
        "duration_seconds": 120, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.03 neutral demo placeholder", "delivery_modes": ["software_guided", "real_world"],
        "completion_signal": "User chooses a wind-down step or stops.", "personalization_signals": ["wants_to_wind_down"],
    },
    "reach_out": {
        "presentation": {"pattern": "steps", "input": "draft", "optional_timer": False},
        "id": "reach_out", "title": "Prepare to reach out", "category": "social",
        "goal": "Consider what you want to share with someone.",
        "situation_fit": ["wants support from someone they choose", "wants to prepare what to say", "is considering contacting a trusted person"],
        "summary": "Think of someone you choose and prepare what you might say. Mira will not send it.",
        "steps": ["Is there someone you would like to contact?", "What would you want them to know?", "You decide whether, when, and how to reach out."],
        "duration_seconds": 120, "effort": "medium", "environment": [], "prerequisites": [],
        "requires_person": True, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira V0.03 neutral demo placeholder", "delivery_modes": ["software_guided", "social"],
        "completion_signal": "User prepares a message or decides not to contact anyone.", "personalization_signals": ["wants_social_support"],
    },
}


def all_interventions() -> list[dict]:
    return [deepcopy(item) | {"catalog_version": CATALOG_VERSION} for item in _CATALOG.values()]


def get_intervention(intervention_id: str) -> dict | None:
    item = _CATALOG.get(intervention_id)
    return deepcopy(item) | {"catalog_version": CATALOG_VERSION} if item else None


def catalog_map() -> dict[str, dict]:
    return {item["id"]: item for item in all_interventions()}
