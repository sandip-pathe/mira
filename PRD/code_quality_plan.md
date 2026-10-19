<!-- Current implementation path and product-scope details in this restored review are historical. Actions/Continue is approved by the Nine Activities Master Blueprint; use PRD/mira_activity_build_status.md for the current Work Order 00 map. -->

<!-- /autoplan restore point: "C:\\y\\mira\\.gstack\\tmp\\autoplan\\code-quality-restore-20261015.md" -->
## Implementation plan
# Mira product and engineering review

Date: 2026-10-15. Static review of the current workspace. No runtime, device, provider, lint, or test checks were run. The workspace has no Git repository metadata, so this review cannot establish change history or provide a diff against a baseline.

## 1. Product direction

Mira already has an Android app, voice and text conversation, activities, Journal, and consent controls. This work improves that existing app. Its core loop is to talk through an everyday difficult moment, optionally try one relevant activity, return to the conversation, and deliberately save only what the person wants retained. Improvements must preserve working behavior and complete the gaps identified below.

The old framing overemphasized the delivery mechanism (an intervention engine), synthetic demonstration, and implementation exclusions. These are useful engineering and operating constraints, but they do not describe the value someone gets. Repeated demo language also leaked into ordinary screens.

The PRD now makes completeness, continuity, recoverable failures, and concise product language explicit. The nine activities, explicit hold-to-talk, privacy choices, single backend, and current restricted evaluation remain the scope. This revision does not establish public readiness or clinical suitability.

There is a product decision to settle before implementation: code exposes an Actions tab with a browsing library and explicitly saved local Continue items, while the PRD and design requirements specify Talk and You with Do opened from Talk, and prohibit a browsing catalog. The existence of code does not establish approval. Recommended baseline: retain the PRD's Talk/You navigation; decide explicitly whether saved follow-through belongs in You before moving or removing any existing saved data. No existing data is deleted by this review.

## 2. Engineering findings

| Priority | Evidence | Consequence and proposed change |
|---|---|---|
| P1 | `mobile/src/Mira.tsx:82-86` accepts prefixes such as `yes` and `okay` to open Do. | A sentence such as “yes, but I don't want to try it” matches acceptance. Use the existing explicit acceptance control as the reliable action boundary. Define deliberate voice confirmation behavior before replacing this with another heuristic or model decision. |
| P1 | `server/app.py:419-435` persists an opted-in run and feedback, then removes the session run. | If saving succeeds but the response is lost, retry uses a run that no longer exists and can return a conflict. Make preference saving idempotent and transactional; return the original confirmed result on retry. Keep sensitive text out of retry logs. |
| P1 | `mobile/src/app/(tabs)/actions.tsx`; `mobile/src/interventions.ts:38-94`; PRD section 4. | Implementation and approved navigation/retention scope disagree. Reconcile the Actions/Continue decision first, including the lifetime and removal of already saved local content. |
| P2 | `mobile/src/InterventionRunner.tsx:48-49,230-274`; catalog has duration and steps but no presentation contract. | IDs select timers, inputs, and screen branches. Add a validated presentation contract covering pattern, inputs, and optional timer, with reusable pattern components. Keep genuine differences explicit; do not build a general workflow language. |
| P2 | `mobile/src/InterventionRunner.tsx:12-35,64-96` has overlapping readiness, completion, pause, local-run, and feedback flags; pending runs are marked started. | The domain state is implicit and permits contradictory combinations. Use a discriminated state model with loading, ready, active, paused, outcome, and finished phases; track server acknowledgement separately from local progress. |
| P2 | `mobile/src/Journal.tsx:112-154,214-228` repeats stop/file cleanup across hide, background, unmount, and explicit stop. | Different exit paths can drift. Give recording and temporary file ownership one lifecycle controller; keep Journal rendering and saved-data operations separate. Check installed Expo documentation before implementation. |
| P2 | `mobile/src/Journal.tsx:124-126,180-183,287` silently ignores file deletion errors while copy promises deletion. | The promise is stronger than the implementation can establish. Define cleanup outcomes, retain cleanup responsibility on failure, and use accurate copy. Preserve retry/discard behavior for failed transcription. |
| P2 | `mobile/src/Mira.tsx:16-175`; `server/app.py` combines schemas, routes, provider access, tools, consent and orchestration. | Changes require reasoning about many unrelated concerns. Extract conversation control and backend application services around actual responsibilities. Moving code alone is insufficient: define inputs, ownership, and failure outcomes. |
| P2 | `ARCHITECTURE.md:19,37,85,142`; `README.md:3`. | Docs describe old navigation, tools, files, and two activities. Rewrite them after product reconciliation and keep target requirements distinct from implemented behavior. |
| P3 | `mobile/src/Journal.tsx:231-288`; duplicated context and offer rendering in `Mira.tsx`. | Dense JSX and lengthy embedded notices slow review. Use named sections and shared components for repeated concepts; centralize copy only where it is reused or independently reviewed. |

The existing catalog, selector adapter, eligibility module, server-held credentials, strict request models, and consent filtering are useful foundations. Ordinary conditionals remain appropriate for authorization, eligibility, and state guards. Fixed catalog content is intentional; adding one activity should mostly change catalog data rather than several screen branches.

## 3. Intended ownership

```text
Screen components -> conversation/activity controllers -> API client
                         |                              |
                  explicit local state                 v
                                                 FastAPI routes
                                                       |
                                              application services
                                               /       |       \
                                         catalog   AI adapter  persistence
                                         + rules              + consent
```

The phone owns presentation, microphone interaction, temporary drafts, and local progress. The backend owns authorization, canonical content, eligibility, consented writes, and replay-safe operations. Model output proposes conversational decisions; it does not authorize saving or starting. SQLite and the existing single service remain sufficient for this scope. No new state-management or animation dependency is required by this plan.

## 4. Implementation slices

| Order | Work | Completion evidence |
|---|---|---|
| 1 | Reconcile Actions/Continue and document the chosen navigation and data lifetime. Align PRD, design requirements, current UX, architecture, and README. Preserve existing saved content until migration/removal behavior is agreed. | One consistent description of destinations, consent, retained data, and unavailable services. |
| 2 | Correct acceptance and save recovery boundaries. Replace prefix acceptance with the agreed confirmation behavior. Make feedback persistence atomic and idempotent with an explicit operation identity. | Focused checks for ambiguous acceptance, duplicate submission, lost response followed by retry, consent refusal, and failed writes. |
| 3 | Introduce the catalog presentation contract, validate every record, and split runner patterns. Replace overlapping lifecycle flags with explicit phases. Keep all nine activities functional. | Each catalog entry selects its expected pattern; invalid content fails clearly; start/pause/stop/return and optional feedback have valid transitions. |
| 4 | Extract Talk control and Journal recording/file ownership. Consolidate duplicated UI and shorten ordinary copy around the agreed privacy behavior. | Voice/text recovery preserves conversation; recording exit paths release capture; failed transcription supports retry/discard; cleanup and save messages match outcomes. |
| 5 | Review the resulting changes against this PRD and run a focused end-to-end Android walkthrough. Update known issues and operating instructions. | Existing relevant contract checks plus one OnePlus walkthrough recording Android version: hold/release/interruption, text fallback, one activity per pattern, Journal consent/revocation, and an outage. |

These are sequential improvements to the existing app, each with reviewable outcomes. Preserve working flows during refactoring. Run checks required by the affected area and use the phone for native behavior; verification effort should follow the risk of the change.

## 5. Review handoff

Product and architecture review are complete enough to prepare implementation. The revised PRD states the target; this document records current gaps and the proposed sequence. Implementation has not started. The remaining product choice is Actions/Continue placement and retention; settle that before changing navigation or stored content. No clinical, authentication, deployment, or wider-use approval is inferred from calling this a working app.
## Review record
