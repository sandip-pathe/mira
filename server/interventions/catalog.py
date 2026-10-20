"""Public activity definitions shared with the bundled mobile catalog."""

from copy import deepcopy
import json
from pathlib import Path


# Keep the canonical JSON inside the mobile bundle; Python reads the same file.
# Server-only deployment packaging must include this public asset as well.
CATALOG_PATH = Path(__file__).resolve().parents[2] / "mobile/assets/catalog/activities.json"
with CATALOG_PATH.open(encoding="utf-8") as source:
    _DATA = json.load(source)

CATALOG_VERSION = _DATA["catalog_version"]
PRIMARY_ACTIVITY_IDS = tuple(_DATA["primary_activity_ids"])
_CATALOG = {item["id"]: item for item in _DATA["activities"]}
_LEGACY_IDS = _DATA["aliases"]

if len(_CATALOG) != len(_DATA["activities"]):
    raise ValueError("Duplicate activity IDs in bundled catalog")
if any(activity_id not in _CATALOG for activity_id in PRIMARY_ACTIVITY_IDS):
    raise ValueError("Unknown primary activity ID in bundled catalog")
if any(activity_id not in _CATALOG for activity_id in _LEGACY_IDS.values()):
    raise ValueError("Unknown activity alias target in bundled catalog")


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
