"""Deterministic demo eligibility. This is not clinical screening."""

from collections.abc import Iterable


def eligible_interventions(
    catalog: Iterable[dict],
    *,
    allowed_review_states: set[str] | None = None,
    excluded_ids: set[str] | None = None,
    available_environment: set[str] | None = None,
    completed_prerequisites: set[str] | None = None,
) -> list[dict]:
    if allowed_review_states is None:
        allowed_review_states = {"demo_approved"}
    excluded_ids = excluded_ids or set()
    available_environment = available_environment or set()
    completed_prerequisites = completed_prerequisites or set()
    eligible = []
    for item in catalog:
        if item.get("id") in excluded_ids:
            continue
        if item.get("review_status") not in allowed_review_states:
            continue
        if not set(item.get("environment", [])).issubset(available_environment):
            continue
        if not set(item.get("prerequisites", [])).issubset(completed_prerequisites):
            continue
        eligible.append(item)
    return eligible
