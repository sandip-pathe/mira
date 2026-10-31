# Mira backend architecture: Gemini context

Use this repository handoff with the research/redesign prompt. These are starting facts, not an architecture proposal. Inspect current code and cite evidence before relying on them.

## Current system

- Mobile app: Expo Router, React Native, TypeScript. Cloud worker API: Python/FastAPI in `server/`.
- OpenAI is the selected AI provider. Text and bounded worker operations call OpenAI through FastAPI. For voice, FastAPI creates a short-lived Realtime credential; the phone connects to OpenAI Realtime over WebRTC. Audio does not pass through FastAPI.
- FastAPI has no durable Mira database. Session capabilities and tool-call bookkeeping are process-memory state, limited to one active demo session; restart clears them. The OpenAI API key stays server-side.
- Device SQLite (`mira-private.db`) and app-owned files hold Journal entries/drafts/audio references, approved excerpts, opted-in activity preferences, Continue items, and saved activity work. Active Talk messages and moment state are in app memory and do not survive restart.
- Local Journal and activity use can work offline. AI replies, voice connection, activity assistance, sorting, and Brain Dump transcription need a reachable service/provider. A confirmed 401 is renewed once; text retry rebuilds its request from current local consent/context.

## Existing request paths

### Text Talk

`mobile/src/features/talk/hooks/useTalkSession.ts` sends the active message history (`next`) and a local context snapshot to `/sessions/{id}/text`. `server/app.py` validates the request, runs `choose_support` through `server/interventions/decision.py`, then calls OpenAI Responses for a structured reply and moment state. A normal text turn can therefore make a selector call and a reply call. Text requests allow up to 50 messages, one context match, and three preferences.

### Realtime voice

`mobile/src/shared/voice.ts` reconnects by restoring confirmed text history to a Realtime session. Audio is streamed directly to OpenAI. Realtime may request `retrieve_shared_context`, `update_moment_state`, or `choose_support`: the phone handles context retrieval and moment-state updates; it relays only `choose_support` to FastAPI. The phone returns tool results into the live Realtime conversation as `function_call_output` items. Tool calls are validated, generation/turn scoped, deduplicated, and expire; inspect the code for exact guarantees.

### Other workers

`server/app.py` also serves temporary Brain Dump transcription credentials, task sorting, and activity assistance. Journal AI follow-up and Journal audio-upload/transcription handlers were removed in the current code. `ARCHITECTURE.md` still lists those older Journal routes; treat code and the 2026-10-23 Journal update in `PRD/mira_prd.md` as newer evidence.

## Context and the observed UX problem

- Sources of context are local approved/unrevoked Journal excerpts and explicitly opted-in activity preferences. Private writing and raw Talk history are not durable server records.
- `mobile/src/shared/context/contextRepository.ts` selects at most one excerpt/preference match using token overlap and a small date rule. It has no semantic/vector retrieval. `contextPreferenceFeatures` returns up to three opted-in preferences independently of keyword matches; the snapshot sends that list even when no excerpt matches.
- Text sends the full active message history plus the snapshot. Realtime retains its live conversation and tool outputs, so retrieved context can remain in that session's history. These are distinct sources of old context and should be analyzed separately.
- The symptom: after earlier discussion, a later simple greeting can prompt Mira to resume an old topic. Do not fix this with a canned greeting, phrase list, or prompt-only instruction. Identify how turn history, moment state, preferences, and retrieved excerpts enter each model call; redesign context assembly and expiry as part of the shared text/voice orchestration contract.

## Product constraints and planned direction

- `PRD/mira_prd.md` is the current V0.03 product contract. The phone remains the owner of private saved data; hosting FastAPI does not authorize server-side storage or syncing.
- Preserve explicit push-to-talk: microphone off by default, hold to speak, release to end, no automatic VAD. Voice failure should preserve the active conversation and allow retry or text continuation. Offline Journal drafts and already-loaded Activities remain usable.
- Mira is non-clinical. Do not add diagnosis, treatment claims, crisis screening, human-support integration, or unapproved product flows.
- `PRD/mira_activity_upgrade_plan.md` describes a planned activity-aware agent: one coherent typed tool/decision contract for voice and text; local purpose-scoped context; backend eligibility and support selection; typed proposals; operation-specific workers; idempotent actions; and recoverable tool failures. It is a plan, not proof those pieces are implemented. Keep phone data ownership and offline behavior.
- Do not assume agentic means multiple agents, a vector database, or a new service. Compare simpler designs and justify every component against Mira's actual flows.

## Repository files to verify first

- Product/architecture: `ARCHITECTURE.md`, `PRD/mira_prd.md`, `PRD/mira_offline_first_plan.md`, `PRD/mira_activity_upgrade_plan.md`.
- Backend: `server/app.py`, `server/interventions/`, `server/workers/`.
- Mobile request/context: `mobile/src/shared/api.ts`, `mobile/src/shared/voice.ts`, `mobile/src/shared/context/`, `mobile/src/features/talk/`.
- Local persistence: `mobile/src/shared/storage/database.ts`, `mobile/src/shared/storage/migrations/001-device-collections.ts` through `012-journal-text-only.ts`.

When researching, distinguish verified public documentation, inspected open-source implementations, repo facts, and recommendations. Do not infer private ChatGPT architecture. Produce a target design and migration/failure plan; do not change code.
