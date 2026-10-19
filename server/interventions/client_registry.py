"""Versioned mobile renderer capabilities accepted by this server build."""

from .catalog import PRIMARY_ACTIVITY_IDS

_CURRENT_CLIENT_IDS = frozenset(PRIMARY_ACTIVITY_IDS) | {'task_reset_60s'}

SUPPORTED_CLIENTS = {
    ('activity-ui-1', '0.04'): frozenset({
        'brain_dump',
        'task_reset_60s',
        'name_a_feeling',
        'write_100_words',
        'reach_out',
        'short_movement',
        'one_song_reset',
        'unsent_message',
        'perspective_shift',
    }),
    ('activity-ui-2', '0.05'): frozenset({
        'brain_dump', 'grounding', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'reach_out', 'short_movement', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-3', '0.06'): frozenset({
        'brain_dump', 'grounding', 'one_small_step', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'reach_out', 'short_movement', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-4', '0.07'): frozenset({
        'brain_dump', 'grounding', 'one_small_step', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'unsent_letter', 'reach_out', 'short_movement', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-5', '0.08'): frozenset({
        'brain_dump', 'grounding', 'one_small_step', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'unsent_letter', 'reach_out', 'short_movement', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-6', '0.09'): frozenset({
        'brain_dump', 'grounding', 'paced_breathing', 'one_small_step', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'unsent_letter', 'reach_out', 'short_movement', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-7', '0.10'): frozenset({
        'brain_dump', 'grounding', 'paced_breathing', 'one_small_step', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'unsent_letter', 'reach_out', 'short_movement', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-8', '0.11'): frozenset({
        'brain_dump', 'grounding', 'paced_breathing', 'one_small_step', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'unsent_letter', 'reach_out', 'short_movement', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-9', '0.12'): frozenset({
        'brain_dump', 'grounding', 'paced_breathing', 'one_small_step', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'unsent_letter', 'reach_out', 'short_movement', 'one_song_break', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-10', '0.13'): frozenset({
        'brain_dump', 'grounding', 'paced_breathing', 'one_small_step', 'task_reset_60s', 'name_a_feeling',
        'write_100_words', 'unsent_letter', 'reach_out', 'short_movement', 'one_song_break', 'one_song_reset',
        'unsent_message', 'perspective_shift',
    }),
    ('activity-ui-11', '0.14'): frozenset({
        *_CURRENT_CLIENT_IDS,
    }),
}


def compatible_ids(capabilities: dict | None) -> set[str]:
    if not capabilities:
        return set()
    supported = SUPPORTED_CLIENTS.get((
        capabilities.get('client_version'),
        capabilities.get('catalog_version'),
    ))
    if not supported:
        return set()
    claimed = capabilities.get('activity_ids')
    if (
        not isinstance(claimed, list)
        or not all(isinstance(value, str) for value in claimed)
        or len(claimed) != len(set(claimed))
    ):
        return set()
    return supported.intersection(claimed)
