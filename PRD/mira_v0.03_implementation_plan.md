# Mira V0.03 implementation plan

**Status:** Phases 1–5 implemented. TypeScript typecheck, Expo lint, and Python syntax compilation pass. The Android device walkthrough was skipped at the user's direction and remains unverified.  
**Inputs:** `mira_prd.md`, `Mira_Design_Requirements_v1.3.md`, and `Mira_UI_Interaction_Specification_v1.3.md`.

## Authority and scope

The Nine Activities Master Blueprint, revision 2.2, now defines the activity catalog, Actions library, Continue behavior, and sequential work orders. The product contracts in `mira_prd.md` remain authoritative for Talk, Journal, privacy, voice, Help, consent, and backend boundaries. Work Order 00 reconciles this plan with those sources; subsequent implementation follows the selected blueprint one order at a time.

Actions is the permanent static library described by the blueprint. Continue contains only explicitly saved work, stored locally on this device. Entry origins are `talk`, `actions_library`, and `actions_continue`; server-side start validation still applies. The exact current behavior and differences from target are recorded in `mira_activity_build_status.md`.

The earlier plan below is retained as historical proposal context only. Its former catalog, product-scope blockers, and implementation sequence are superseded by the blueprint and must not be used to reopen those decisions.

## Existing implementation

The repository already has the catalog, eligibility and decision modules, Talk voice/text flow, a shared Do runner, Journal and approved context, saved preferences, and a demo reset. The structural work is adding Actions, supporting direct-entry Do routing, and implementing the narrowly scoped local Continue list. Known PRD gaps also include Reach Out preparation input, pause/resume for step activities where applicable, and retryable feedback saving.

## Build phases

### Phase 1 — Establish contracts

1. Define the Actions screen model and static catalog grouping using the canonical catalog records.
2. Define the minimal device-local Continue item schema and supported activity-specific payloads listed above.
3. Define the origin-aware Do route parameters and return behavior.
4. Confirm that activity start still calls the backend validation path independently of library visibility.

**Deliverable:** agreed route, local-storage, and start-validation contracts; no visual polish.

### Phase 2 — Actions and local Continue

1. Add the Actions permanent tab between Talk and You.
2. Render all nine canonical activities, with static groups and no personalized ranking.
3. Add local persistence for explicitly saved eligible work, with a review/confirmation surface showing exactly what will be kept.
4. Add Continue resume, mark-done, and remove actions. Keep the previous item visible if a local update fails.
5. Ensure Continue remains independent of catalog availability and contains no automatic entries.

**Deliverable:** usable Actions library and device-local Continue flow.

### Phase 3 — Shared Do routing

1. Support `talk`, `actions_library`, and `actions_continue` origins in the shared runner.
2. Preserve Talk context when entering Do from Talk and return to the correct origin on Back, Skip, Stop, and completion.
3. Require explicit acceptance for Talk offers and explicit Start after Actions introductions.
4. Apply start eligibility/server validation regardless of entry origin; show an accurate failure state if start is denied or unavailable.
5. Offer Continue persistence only for the eligible concrete work above. Never auto-save completion or transient activities.

**Phase 3 gate — device verification pending:**

- Walk through Actions → introduction → Start → return.
- Walk through Talk → accept offer → Do → return to the same Talk context.
- Save, resume, complete, and remove each supported Continue item type.
- Confirm transient activities never appear in Continue and library items stay visible independently from start eligibility.

The original plan made this a stop gate. The user later directed implementation to continue without the walkthrough. Phases 4–5 proceeded; no claim is made that these structural flows have been exercised on the primary Android device.

### Phase 4 — Outcomes and feedback

1. Ask whether the activity was tried, whether it helped, and whether Mira may suggest it again.
2. Show the exact future-use preference before saving and require explicit consent.
3. Add retry behavior for failed feedback saves; never report success before persistence succeeds.
4. Keep preference saving separate from Continue, Journal saving, and approval of excerpts for Talk.

### Phase 5 — Visual system and accessibility

1. Apply the v1.3 Talk, Actions, Do, and You hierarchy and candidate warm-light palette.
2. Preserve accurate voice states, interruption, text fallback, persistent Help, and scripted emergency-demo behavior.
3. Check 48dp targets, TalkBack roles/labels/state announcements, text scaling, keyboard and Android Back behavior, safe areas, and reduced-motion behavior.
4. Treat orb, fonts, and motion as presentation choices; the source docs say these remain unvalidated hypotheses.

### Phase 6 — Focused verification

Run focused checks for catalog visibility vs. start eligibility, origin-aware routes, local Continue consent/lifecycle, preference consent, and feedback retry. Complete one synthetic walkthrough on the primary OnePlus Android device and record its Android version. Avoid broad test infrastructure.

## Guardrails

- Keep exactly the nine canonical activities; no AI-authored or additional activities.
- Keep deterministic eligibility and backend validation for starts; catalog visibility is not an eligibility decision.
- Keep GPT behind the existing replaceable decision adapter and maintain one FastAPI service.
- Do not add Continue sync, accounts, reminders, analytics, arbitrary saved runner state, automatic history retention, or broader memory.
- Do not retain raw Talk transcripts/audio or infer traits. Brain Dump remains temporary unless explicitly saved through its allowed Continue choice.
- Preserve explicit hold-to-talk, microphone off by default, text fallback, persistent Help, and the exact scripted emergency demo boundary.
- Keep Reach Out user-mediated; Mira prepares wording but never sends a message.
- Keep the app a private synthetic-data demo, not a clinical product or public pilot.
