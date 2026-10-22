# Approved Mira artwork

Copied unchanged from the selected UI Lab assets in RN-00, 2026-10-21. Source paths, hashes, dimensions and square viewBox regions are recorded in [the handoff manifest](../../../docs/ui-native-handoff/assets.json).

- `mira-signature.png`: approved lettering source. Apply native alpha tint `#315A45` for the locked forest wordmark; the source pixels are blue.
- `little-company-plate.png`: original companion, Activities motif and Journal notebook, left to right.
- `mascot-poses.png`: listening, thinking and speaking poses, left to right.

Both illustration sheets are 2172 × 724 RGBA. Render their 724 × 724 regions proportionally using the recorded viewBoxes. Preserve their alpha and olive/cream/peach colors; do not tint the full illustration. RN-03 connects the wordmark and companion poses in Talk through `TalkHeader` and the shared `BrandArtwork` renderer. Activities/Journal motif placement and phone rendering review remain pending.
