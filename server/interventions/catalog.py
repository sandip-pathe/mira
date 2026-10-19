"""Canonical post-event reflection and follow-through activities."""

from copy import deepcopy

CATALOG_VERSION = "0.14"

# Canonical activities exposed to the current Actions and Talk surfaces.
# Transitional catalog entries below remain available to legacy Continue/start paths.
PRIMARY_ACTIVITY_IDS = (
    "grounding",
    "paced_breathing",
    "brain_dump",
    "one_small_step",
    "name_a_feeling",
    "unsent_letter",
    "reach_out",
    "short_movement",
    "one_song_break",
)

_CATALOG = {
    "grounding": {
        "presentation": {"pattern": "grounding", "input": "none", "optional_timer": False},
        "id": "grounding", "title": "Grounding", "category": "Follow a guide",
        "goal": "Notice real things around you at your own pace.",
        "situation_fit": ["wants a brief sensory noticing guide", "wants to notice their surroundings"],
        "summary": "Take a moment to notice what is around you. Follow at your pace. Skip any prompt.",
        "steps": ["Notice 3 things you can see.", "Notice 2 things you can hear.", "Notice one comfortable point of contact, such as your feet or the chair."],
        "duration_seconds": 180, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User acknowledges or skips each sense, then chooses to finish.", "personalization_signals": [],
    },
    "paced_breathing": {
        "presentation": {"pattern": "breathing", "input": "none", "optional_timer": False},
        "id": "paced_breathing", "title": "Paced Breathing", "category": "Follow a guide",
        "goal": "Follow a comfortable rhythm or breathe at your own pace.",
        "situation_fit": ["wants a gentle breathing rhythm", "wants a brief guided pause"],
        "summary": "Breathe gently without forcing it. Stop anytime if it feels uncomfortable.",
        "steps": ["Follow a comfortable rhythm, or breathe at your own pace.", "Breathe gently without forcing it.", "Stop anytime if it feels uncomfortable."],
        "duration_seconds": 40, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User finishes a guided round, chooses another, or stops.", "personalization_signals": [],
    },
    "brain_dump": {
        "presentation": {"pattern": "capture", "input": "draft", "optional_timer": False},
        "id": "brain_dump", "title": "Brain Dump", "category": "Express",
        "goal": "Put thoughts somewhere temporary without needing to organize them.",
        "situation_fit": ["thoughts keep circling", "several things compete for attention", "wants to get thoughts out"],
        "summary": "Write what is on your mind. Sorting it is optional, and the draft is temporary.",
        "steps": ["What keeps coming back to mind?", "Write freely. You can leave it messy.", "Choose one thing to talk about, or stop here."],
        "duration_seconds": 120, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User finishes, selects a topic, or stops.", "personalization_signals": ["prefers_writing", "rumination"],
    },
    "task_reset_60s": {
        "presentation": {"pattern": "sort", "input": "next_step", "optional_timer": False},
        "id": "task_reset_60s", "title": "Tiny Next Step / Task Reset", "category": "Find a next move",
        "goal": "Choose one manageable next action from a crowded list.",
        "situation_fit": ["many tasks competing for attention", "unclear where to begin", "feels stuck on a task"],
        "summary": "Get tasks out of your head, sort if useful, and choose one small action.",
        "steps": ["What is taking up space?", "Sort or edit the list if useful.", "Choose one small next action, or stop here."],
        "duration_seconds": 120, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "real_world"],
        "completion_signal": "User chooses an action or stops.", "personalization_signals": ["task_overwhelm", "wants_to_start_task"],
    },
    "one_small_step": {
        "presentation": {"pattern": "sort", "input": "next_step", "optional_timer": False},
        "id": "one_small_step", "title": "One Small Step", "category": "Move forward",
        "goal": "Turn a task into one clear first move.",
        "situation_fit": ["many tasks competing for attention", "unclear where to begin", "knows a task but needs an easier start"],
        "summary": "Choose one task and make its first move easier to start.",
        "steps": ["Choose a starting path.", "Select one task.", "Name one small first move."],
        "duration_seconds": 180, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "real_world"],
        "completion_signal": "User creates a first-move card, optionally tries or keeps it, or leaves.", "personalization_signals": ["task_overwhelm", "wants_to_start_task"],
    },
    "name_a_feeling": {
        "presentation": {"pattern": "steps", "input": "choice_or_text", "optional_timer": False},
        "id": "name_a_feeling", "title": "Notice & Name", "category": "Express",
        "goal": "Describe what is happening in the user's own words.",
        "situation_fit": ["wants to make sense of a recent event", "unsure what they feel", "wants to put an experience into words"],
        "summary": "What comes closest to this moment? Choose words, use your own, or leave it uncertain.",
        "steps": ["Choose words that fit, if any.", "Edit a phrase in your own words.", "You can finish or check a thought."],
        "duration_seconds": 90, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User selects, writes, reflects, skips, or stops.", "personalization_signals": ["wants_to_understand_moment"],
    },
    "write_100_words": {
        "presentation": {"pattern": "letter", "input": "letter", "optional_timer": False},
        "id": "write_100_words", "title": "Write 100 Words to Them", "category": "Write it out",
        "goal": "Draft a short note about what the user wishes someone understood.",
        "situation_fit": ["replaying a difficult interaction", "wishes someone understood their side", "wants to write before deciding what to do"],
        "summary": "Write what you wish they understood. The 100-word target is optional; the note stays unsent.",
        "steps": ["What do you wish they understood?", "Write a few words or as much as you want.", "Choose whether to save this letter privately."],
        "duration_seconds": 300, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User finishes, saves, or stops.", "personalization_signals": ["prefers_writing", "post_event_reflection"],
    },
    "reach_out": {
        "presentation": {"pattern": "steps", "input": "draft", "optional_timer": False},
        "id": "reach_out", "title": "Reach Out", "category": "Move forward",
        "goal": "Consider contacting someone and prepare what to say.",
        "situation_fit": ["wants support from someone they choose", "wants to prepare what to say", "is considering contacting someone"],
        "summary": "Choose a starting point, edit a message, and decide whether to keep or copy it. Mira will not send it.",
        "steps": ["Choose what you might want to ask for.", "Edit the message in your own words.", "Preview the exact text before you copy, keep, or return."],
        "duration_seconds": 120, "effort": "medium", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "social"],
        "completion_signal": "User drafts, decides not to contact, or stops.", "personalization_signals": ["wants_social_support"],
    },
    "short_movement": {
        "presentation": {"pattern": "steps", "input": "choice_or_text", "optional_timer": True},
        "id": "short_movement", "title": "Move / Change Your Scene", "category": "Take a break",
        "goal": "Choose a comfortable change of scene or movement.",
        "situation_fit": ["wants an accessible brief change of scene", "wants an optional short walk", "wants a no-movement break"],
        "summary": "Choose a short walk, comfortable movement, a change of spot, or a no-movement break. Movement is optional.",
        "steps": ["Choose an accessible break that feels comfortable, or skip.", "Put your phone away and come back whenever you want.", "Let Mira know what you chose."],
        "duration_seconds": 300, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["real_world"],
        "completion_signal": "User returns, chooses another option, skips, or stops.", "personalization_signals": ["movement_preference", "wants_change_of_scene"],
    },
    "one_song_break": {
        "presentation": {"pattern": "steps", "input": "choice_or_text", "optional_timer": False},
        "id": "one_song_break", "title": "One Song Break", "category": "Take a break",
        "goal": "Take a user-chosen listening break using their music app.",
        "situation_fit": ["wants to take a short listening break", "wants to use music they choose", "wants a break without in-app playback"],
        "summary": "Choose music in your app or provide an allowlisted music link. Mira cannot tell whether it plays.",
        "steps": ["Choose your music app or enter a music link.", "Switch to your music app and listen for as long as you want.", "Return and tell Mira what you chose."],
        "duration_seconds": 240, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["real_world"],
        "completion_signal": "User returns and self-reports, skips, or stops.", "personalization_signals": ["wants_a_break"],
    },
    "unsent_message": {
        "presentation": {"pattern": "letter", "input": "letter", "optional_timer": False},
        "id": "unsent_message", "title": "Unsent Message", "category": "Write it out",
        "goal": "Write freely to someone without deciding whether to send it.",
        "situation_fit": ["has words they are not ready to say", "replaying a conversation", "wants to write without sending"],
        "summary": "Write freely. Nothing is sent, and saving the letter is your choice.",
        "steps": ["Who or what is this message for? (Optional)", "Write whatever you want to say.", "Choose whether to save this letter privately."],
        "duration_seconds": 300, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User finishes, saves, or stops.", "personalization_signals": ["prefers_writing", "post_event_reflection"],
    },
    "unsent_letter": {
        "presentation": {"pattern": "letter", "input": "letter", "optional_timer": False},
        "id": "unsent_letter", "title": "Unsent Letter", "category": "Express",
        "goal": "Write what you wish you could say, without deciding whether to send it.",
        "situation_fit": ["has words they are not ready to say", "wants to write at their own pace", "wants to review a letter before closing it"],
        "summary": "Write what you wish you could say. You do not have to send it.",
        "steps": ["Add a name if you want, then write at your own pace.", "Read your letter or return to editing.", "Choose whether to discard it or bring a selected part to Talk."],
        "duration_seconds": 300, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User reviews, discards, transfers a selected excerpt, or stops.", "personalization_signals": ["prefers_writing", "post_event_reflection"],
    },
    "perspective_shift": {
        "presentation": {"pattern": "steps", "input": "reflection", "optional_timer": False},
        "id": "perspective_shift", "title": "Perspective Shift", "category": "Make sense of it",
        "goal": "Consider possible interpretations without assuming another person's thoughts.",
        "situation_fit": ["trying to make sense of someone's response", "stuck on what another person meant", "wants to consider another angle"],
        "summary": "Explore a possible view from their side. These are guesses, not facts.",
        "steps": ["What do you know for sure?", "What are a few things they might have been thinking? These are only possibilities.", "Does any possibility change what you want to do next?"],
        "duration_seconds": 120, "effort": "low", "environment": [], "prerequisites": [],
        "requires_person": False, "contraindications": [], "review_status": "demo_approved",
        "source": "Mira neutral demo activity", "delivery_modes": ["software_guided", "mental"],
        "completion_signal": "User considers, rejects, skips, or stops.", "personalization_signals": ["wants_another_view"],
    },
}

# Existing on-device Continue items can still open the merged task experience.
_LEGACY_IDS = {"tiny_next_step": "task_reset_60s", "pause_60s": "paced_breathing", "one_song_reset": "one_song_break"}


def all_interventions() -> list[dict]:
    return [deepcopy(item) | {"catalog_version": CATALOG_VERSION} for item in _CATALOG.values()]


def primary_interventions() -> list[dict]:
    items = {item["id"]: item for item in all_interventions()}
    return [items[activity_id] for activity_id in PRIMARY_ACTIVITY_IDS]


def get_intervention(intervention_id: str) -> dict | None:
    item = _CATALOG.get(_LEGACY_IDS.get(intervention_id, intervention_id))
    return deepcopy(item) | {"catalog_version": CATALOG_VERSION} if item else None


def catalog_map() -> dict[str, dict]:
    return {item["id"]: item for item in all_interventions()}
