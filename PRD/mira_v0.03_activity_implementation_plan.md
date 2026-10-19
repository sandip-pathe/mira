> **Superseded proposal (2026-10-19):** This plan's catalog, retention model, and Actions policy conflict with the selected [Nine Activities Master Blueprint](Mira_Nine_Activities_Master_Blueprint_v2.1.md), revision 2.2, and the reconciled [V0.03 PRD](mira_prd.md). Do not execute this plan. Work is governed by the blueprint's sequential work orders and tracked in [the activity build ledger](mira_activity_build_status.md). The remaining content is retained as historical design context only.

# Mira V0.03 Activity Experience and Implementation Plan

**Status:** Planning proposal; no code changes made.  
**Date:** 2026-10-17  
**Scope:** The nine activities in `PRD/mira_prd.md`, excluding the Do screen as a product surface. This document plans richer activity discovery/presentation and the activity experiences themselves.  
**Operating boundary:** Private synthetic-data demo. Activities remain neutral prototypes, not therapy or treatment. Mpower clinician review is required before broader use.

## 1. Recommendation

Make the Activities experience feel like a set of small, inviting things a person can actually try, rather than a stack of text rows. Keep the nine canonical activity IDs and existing server selection/consent rules. Give each activity a clear visual identity, one compact preview, and a focused interactive run with a visible sense of progress, optional motion, and meaningful user input. Keep the experience light: designed illustrations and a few low-cost state transitions should carry the visual identity; the activity itself should remain the focus.

Treat **Mobile Detox** as a future candidate, not a tenth activity or an assumed replacement. Evidence on broad social-media abstinence is mixed. If Mira later explores it, test a small, voluntary “phone pause” with an easy exit and no app blocking, device monitoring, streaks, or moral framing.

There is a navigation/scope conflict to resolve before implementation: `mira_prd.md` says Do opens from Talk and prohibits a permanent activity library; the implementation plan and current app describe a permanent Actions activity library. This plan can improve the screen already in code, but the product owner must confirm that the library is approved before shipping that navigation. The activity designs below can also be reached from Talk without changing their core run experience.

## 2. Product and evidence principles

- Offer activities only when wanted. A Talk suggestion still asks permission; a library entry opens an introduction and requires an explicit Start. Skip, pause, stop, and return remain easy to find.
- Keep every prompt optional. No activity requires a disclosure, a positive feeling, a physical action, a message to another person, or an outcome report.
- Do not promise that a brief activity reduces anxiety, improves sleep, treats a condition, or “resets” the brain. Ask whether it was tried and how it felt; do not treat completion as benefit.
- Keep raw activity text and voice transcripts temporary. Brain Dump and Reach Out drafts are not saved to Journal, Continue, or server memory without a separate user action and confirmation. Avoid adding activity analytics or retention.
- Keep the visual system discreet and accessible. Use custom, non-clinical illustrations and meaningful state cues; animations must be short, nonessential, respect reduced-motion settings, and never convey meaning through color alone.
- Keep evidence in proportion. WHO’s stress guide contains short grounding and notice-and-name exercises, but it does not validate Mira’s exact scripts. Affect-labeling findings come from specific laboratory research. Writing and digital-detox reviews show varied outcomes. Use these sources to inform design, not to make efficacy claims.

## 3. The nine activity concepts

Durations below are ceilings or suggested pacing, never a countdown the person must beat. For screen-only activities, an optional timer is user-controlled. “Visual hook” means a small illustration or animation, not stock photography, streaks, badges, or gamification.

### 3.1 `task_reset_60s` — Task Reset

**Purpose and evidence:** Make a crowded task list easier to look at and let the user choose one next action. Specific if–then plans have evidence for supporting goal attainment, but results vary by population and task; Mira should not imply guaranteed follow-through ([meta-analysis of MCII](https://pmc.ncbi.nlm.nih.gov/articles/PMC8149892/)).

**Demo flow:** (1) Intro: “Get it out of your head. Keep what matters; skip anything.” (2) Capture up to 30 short items by typing; optional voice capture may use the same explicit hold-to-talk interaction specified below. (3) Offer three editable buckets: “Now,” “Later,” and “Not for me.” Sorting is optional. (4) Ask the user to choose one item or “I’m done for now.” (5) Ask for the smallest next action and, optionally, “When might you try it?” (6) Show a simple take-away card with the selected action and optional cue; only offer explicit Continue saving if the existing policy allows it.

**Visual/interaction:** A loose cloud of task slips gently settles into three columns. Items are tappable, reorderable by accessible move controls, and editable. Do not auto-sort without showing it as a suggestion. A subtle progress marker advances by stage; no timer pressure.

**Software/data:** Reuse the `sort` presentation and `task-reset/organize` endpoint. Preserve every input line in the original list. Treat server grouping as a suggestion; validate its response contains every original item exactly once, otherwise show the local list and manual sorting. Keep the final choice local to the run. A future “when” cue is optional and must not create a reminder without a separately approved feature.

**Acceptance:** User can capture, edit, manually sort, ignore sorting, choose one item, decline to choose, and return. Network failure never removes the original list or blocks manual use. No input is retained after leaving unless the existing explicit save path is used.

### 3.2 `pause_60s` — A Short Pause

**Purpose and evidence:** Create a small transition point before the user decides what to do next. This is a neutral demo placeholder, not a breathing or regulation treatment.

**Demo flow:** (1) Intro: “Want a short pause? You can skip or stop whenever.” (2) Offer a user-controlled 30- or 60-second optional timer, plus “No timer.” (3) Show one quiet visual that slowly changes shape or brightness; prompt “Notice one thing around you, if you want.” (4) End with “What would you like next?” and choices: return to Talk, choose another action, or finish.

**Visual/interaction:** Soft expanding/contracting shape or ambient gradient, with no breathing instruction or synchronized inhale/exhale. Pause/resume and end controls stay visible. Motion off by default when reduced motion is enabled; a still visual remains.

**Software/data:** Existing `steps` pattern with `optional_timer`. Timer is foreground-only and already pauses when the app backgrounds. Do not add lock-screen timers, notifications, audio playback, or automatic restart.

**Acceptance:** Timer is optional, accurately pauses in background, can be ended early, and never claims the person completed a therapeutic exercise.

### 3.3 `name_a_feeling` — Name the Feeling

**Purpose and evidence:** Help the user find words for what is happening now, if that feels useful. Research on affect labeling includes laboratory findings, not proof that Mira’s feature produces a clinical effect ([Lieberman et al.](https://pubmed.ncbi.nlm.nih.gov/17576282/)).

**Demo flow:** (1) Ask: “What word comes closest to this moment?” (2) Show a small editable set of neutral feeling words (e.g., tense, disappointed, excited, numb, unsure, something else) and a free-text option. (3) Ask whether they want to add a sentence, keep the word, or skip. (4) Reflect the selected word without interpretation: “You picked ‘overwhelmed.’ Want to say more, or leave it there?” (5) Return to Talk or finish.

**Visual/interaction:** A calm word constellation or selectable word chips with a restrained highlight. Avoid mood scale scoring, mood history, emotion inference, or labels like “correct.”

**Software/data:** Existing `steps` pattern currently has no input; extend presentation input minimally with a single ephemeral `choice_or_text` capture. The selected word is not automatically sent to the model, memory, or Journal. If Talk reflection is desired, show the exact text and ask before sharing it with Talk.

**Acceptance:** User can pick, enter their own word, decline to label, edit, or leave. No AI-generated diagnosis, sentiment score, or inferred trait.

### 3.4 `grounding` — Notice What Is Around You

**Purpose and evidence:** Offer a short, optional sensory noticing sequence. WHO’s “Doing What Matters in Times of Stress” includes several grounding exercises and companion audio; use it as a design reference, not as permission to copy its wording or audio wholesale ([WHO toolkit](https://tdr.who.int/home/our-work/global-engagement/9789240003927), [guide publication](https://www.who.int/publications/i/item/9789240003927)).

**Demo flow:** (1) Intro: “If it feels okay, notice a few things around you. You can keep your eyes open and stop at any point.” (2) Step 1: “Look around. Name one thing you can see.” (3) Step 2: “Notice one sound, or one thing you can feel against your body.” (4) Step 3: “Would you like another prompt, or stop here?” (5) Close with a neutral option to return to Talk.

**Visual/interaction:** One large illustrated “window” or scene per step; the focus moves gently to a different abstract detail. The visual does not require the user to look at the screen; audio narration is not required. Provide text prompts and a Skip button at every step.

**Software/data:** Existing `steps` pattern; ensure skip and stop are first-class, not only Next. Consider per-step optional audio only as a later, reviewed asset; current V0 voice rules do not make Do a listening session. Keep progress step-based and ephemeral.

**Acceptance:** Exercise is usable without looking at the screen, discloses no personal information, and can be exited at any step without penalty.

### 3.5 `brain_dump` — Brain Dump

**Purpose and evidence:** Give thoughts somewhere temporary to land; sorting is optional. Expressive-writing research is heterogeneous and does not support promising a reliable immediate benefit ([2023 meta-analysis](https://pubmed.ncbi.nlm.nih.gov/36536513/), [2025 review of positive expressive writing](https://pubmed.ncbi.nlm.nih.gov/40397857/)).

**Demo flow:** (1) Intro: “Let it be messy. You don’t have to organize it or keep it.” (2) Choose “Type” or “Say it.” (3) Typing shows a spacious editor and optional prompt cards (“What’s taking up space?” / “Anything else?”). (4) Voice uses an explicit press-and-hold mic; release ends capture and displays an editable transcript. Mic remains off until held; no background capture, automatic VAD, locked-open mic, or hands-free mode. (5) Offer “Leave it here,” “Pick one thing to talk about,” and “Clear and leave.” If user picks a thought to bring to Talk, preview and confirm the exact text before sending.

**Visual/interaction:** Open, notebook-like canvas with subtle paper/ink motion; keep controls visible above keyboard. A tiny animated ink line can appear while typing, but avoid word counts, timers as pressure, confetti, or auto-generated psychological summaries. The transcript can be edited or deleted before any explicit share.

**Software/data:** Existing `capture` pattern plus a local capture-mode selector and voice controller. Reuse the app’s existing OpenAI Realtime/WebRTC path only if it supports a separate explicit hold-to-talk capture mode; otherwise ship typing first and scope voice capture as a follow-up. Follow current project constraints: no VAD, mic off by default, no raw audio retention. Do not reuse `TalkTextComposer` as the activity screen; it is the Talk message composer. Introduce Brain Dump capture inside the activity runner, with a dedicated component. Do not call Journal save or Continue automatically. Raw input lives in component state and is cleared on stop/leave.

**Acceptance:** Typing always works. Voice is visibly off by default, requires hold and release, produces editable text, and has a clear discard action. A confirmed share to Talk includes only the previewed text. No dump is retained on stop, app restart, or reset unless the user explicitly chooses an already-approved save path.

### 3.6 `tiny_next_step` — Choose a Tiny Next Step

**Purpose and evidence:** Turn a user-chosen task into one action that feels small enough to consider. If–then planning research suggests a concrete cue can support follow-through, but Mira should frame the plan as an option, not a commitment ([meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC8149892/)).

**Demo flow:** (1) “What would you like to move forward?” (2) “What is the smallest first move?” (3) Offer examples only as editable suggestions (open the document, find the number, put shoes by the door). (4) Ask “Try it now, leave it for later, or change it?” (5) Optional “If [cue], I’ll [tiny action]” card; user edits both halves. (6) Return to Talk or finish.

**Visual/interaction:** A single step card grows from a larger task card; optional “shrink it” control offers simpler alternatives without telling the user their idea is wrong. Completion state is user-reported, never inferred from timer expiry.

**Software/data:** Existing `steps` pattern with `next_step` input. Store draft in runner state; local Continue is explicit and only if navigation/Continue scope is confirmed. No reminders or notification scheduling.

**Acceptance:** User can choose “not now,” edit/delete the step, and finish without committing. Timer is absent by default; if later added, it is user-controlled and does not imply task completion.

### 3.7 `short_movement` — Short Movement Break

**Purpose and evidence:** Offer a comfortable opportunity to move or step away from the screen. WHO states that some physical activity is better than none, while this activity is only a brief demo invitation—not a fitness prescription ([WHO physical activity fact sheet](https://www.who.int/news-room/fact-sheets/detail/physical-activity)).

**Demo flow:** (1) “Would a little movement feel okay right now?” (2) Offer choices: short walk, seated stretch, stand and shift, choose your own, or skip. (3) If chosen, show a simple optional timer (1–5 minutes) and “Come back whenever.” (4) Close with “How was that for you?” optional, then Talk/finish.

**Visual/interaction:** A small looping illustration with alternatives that do not require standing, walking, range of motion, or leaving the user’s current location. Timer ring is decorative; no streak or step counter.

**Software/data:** Existing `steps` plus optional timer; keep timer foreground-only and pause on app background. Content must not assume mobility, private space, or equipment. Avoid health sensors and activity tracking.

**Acceptance:** Movement is optional; a seated/no-movement alternative and skip are visible. No instructions that cause pain or push through discomfort; stop is immediate. No activity tracking or calibration against a health target.

### 3.8 `sleep_wind_down` — Wind Down for Rest

**Purpose and evidence:** Help the user choose one personally comfortable transition toward rest. Public-health sleep guidance commonly recommends a relaxing routine and consistent schedule, but Mira’s short chooser is not insomnia treatment ([CDC/NIOSH guidance](https://www.cdc.gov/niosh/bulletin/2020/sleep.html)).

**Demo flow:** (1) “Would one small wind-down step fit tonight?” (2) Offer selectable ideas: dim a light, put tomorrow’s reminder on paper, wash up, play something familiar, set the phone aside—or add their own. (3) Ask what feels realistic now. (4) Show a one-step card and “Do this now,” “Later,” or “Skip.” (5) No prompt to stay in Mira, and no reminder unless separately approved.

**Visual/interaction:** Warm low-light illustration, extremely subtle transition and no bright flash. Provide static visual/reduced-motion mode. Avoid ambient audio by default and avoid screens that encourage extended use at bedtime.

**Software/data:** Existing `steps` pattern with a minimal `choice_or_text` input. No clock access, sleep tracking, notification, or adaptive bedtime logic for demo. Keep chosen step ephemeral unless explicitly saved through an approved mechanism.

**Acceptance:** User can choose, write their own, skip, or exit; the activity does not claim it will cause sleep or stay open as a bedtime companion.

### 3.9 `reach_out` — Prepare to Reach Out

**Purpose and evidence:** Support a voluntary user decision to contact someone they choose. The U.S. Surgeon General’s social-connection advisory frames social connection as important to health, but Mira must not assume that reaching out is safe or wanted for a particular person ([advisory](https://www.hhs.gov/sites/default/files/surgeon-general-social-connection-advisory.pdf)).

**Demo flow:** (1) Ask “Would contacting someone feel useful, or would you rather not?” (2) If yes, let the user name/select a person locally or choose “I know who, don’t write it here.” Avoid contact-list permissions. (3) Choose what kind of support they want (listen, check in, practical help, something else). (4) Offer a short editable draft with neutral starter text or a blank field. (5) Preview and offer “Copy,” “Edit,” “I’ll send it myself,” or “Not now.” The user sends via their own app; Mira never sends. (6) Clear draft on exit unless user explicitly chooses an approved local Continue save.

**Visual/interaction:** Message-card preview with a visible “Not sent” badge, clear edit/copy controls and a private-space reminder before copying. No urgency countdown, recipient suggestions, address-book import, or guilt framing.

**Software/data:** Existing `steps` pattern has `input: draft`; make the draft step stateful and ensure the runner/outcome path does not place it in analytics, model context, or server preferences. Clipboard sharing is a user action; show exactly what will be copied. Avoid Android contacts permission. Explicit Continue can retain only if the user confirms and navigation/Continue policy allows it.

**Acceptance:** No recipient lookup or message send occurs. User can decide not to reach out at every stage. Copy contains only the previewed draft. Draft clear/discard and save behavior are explicit.

## 4. Shared activity experience and technical design

### 4.1 Activity card and detail model

Each catalog item should render a visual card with: title; short “when this might fit” copy; suggested duration; a small custom illustration; and one clear action. Avoid presenting catalog categories as a diagnosis or making the list look like a clinical prescription. Detail/intro should disclose what the activity involves, what input is kept, and how to leave.

Keep stable catalog IDs and canonical content in FastAPI. Add only presentation metadata that remains safe and non-personal (illustration key, accent token, short card label, optional timer and input schema). Keep executable behavior in the mobile runner, not model-generated steps. Consider catalog response compatibility and versioning before adding required fields; older clients should receive sensible visual fallbacks.

### 4.2 Reusable runner architecture

The app already has the right base shape:

```text
Talk / Activities selection
  -> /do route with activity ID and origin
  -> InterventionRunner
  -> useInterventionRun lifecycle and server validation
  -> reusable sort / capture / steps panels
  -> activity outcome and return
```

Preserve that structure. Upgrade the panels as composable primitives and add only interaction primitives the nine activities need:

- `sort`: editable list, three user-controlled buckets, preserve source items, choose one next step.
- `capture`: keyboard draft plus explicit voice-capture state, edit, clear, and preview-before-share.
- `steps`: content steps with optional input type (`none`, `next_step`, `draft`, or small approved `choice_or_text`), optional user-controlled timer, skip and pause.
- shared `ActivityIntro`, `ProgressCue`, `Illustration`, `ChoiceChips`, `DraftEditor`, and `ActivityExit` elements.

Avoid a general-purpose workflow engine or bespoke screen per activity. Catalog data chooses text and simple presentation options; fixed mobile code implements the behavior. Server continues to own approved catalog content, activity-start validation, run state, and feedback. Styling and transitions remain mobile-side.

### 4.3 Voice in Brain Dump and relation to TalkTextComposer

The tagged [TalkTextComposer.tsx](../mobile/src/features/talk/components/TalkTextComposer.tsx) is a text message input for Talk; it sends a conversation turn or switches the user to Talk voice mode. It should not become the Brain Dump UI. Brain Dump needs a dedicated capture component inside Do, because it collects a temporary draft, supports edit/discard, and should not submit every capture as a Talk message.

V0.03 should prioritize reliable typing. Voice capture is a follow-up only if it can reuse the approved OpenAI Realtime/WebRTC integration without violating explicit push-to-talk. The mic must be off by default; press-and-hold captures; release ends the turn; no automatic VAD. Show capture/processing/transcript-ready states. Convert the resulting transcript to editable text, not an audio recording attachment. Keep the transcript local to the current run; require explicit preview/confirmation before sharing a selected excerpt with Talk. No auto-save to Journal or Continue.

Before implementation, inspect current Realtime event handling and selected RN WebRTC package versions. Do not substitute Expo audio recording for the approved Realtime voice path. OpenAI Realtime documentation defines `turn_detection: null` as disabling automatic turn detection; use the existing app contract and current official docs when implementing ([Realtime API reference](https://platform.openai.com/docs/api-reference/realtime-client-events)).

### 4.4 Animation, imagery and accessibility

- Prefer original SVG/vector illustrations and simple React Native transforms/opacity over a new raster/image or animation dependency. Asset style should be consistent and abstract enough to avoid age, culture, disability, or emotion stereotypes.
- Use short transitions for step changes, selection, card expansion, and timer progress. Decorative animation never blocks controls and never runs indefinitely at high intensity.
- Respect Android reduced-motion/accessibility preferences, system font scaling, screen readers, keyboard focus, and contrast. Keep touch targets at least the project standard of 48 dp; announce step changes and capture states accessibly.
- Add one visual fallback for each card if the illustration key is missing or offline. No network-loaded images are needed for the demo.
- Before choosing animation APIs, check installed React Native, Expo, Reanimated and Gesture Handler versions and follow the applicable project guidance. No new animation or gesture dependency solely for polish.

### 4.5 Data flow and privacy

```mermaid
sequenceDiagram
    participant U as User
    participant A as Activities / Talk
    participant D as Do runner
    participant API as FastAPI
    participant C as Canonical catalog
    U->>A: Select activity (or accept Talk offer)
    A->>D: activity ID + origin
    D->>API: Load activity; validate explicit start
    API->>C: Return canonical approved content
    C-->>D: Steps + presentation metadata
    U->>D: Enter optional activity input
    D->>U: Preview, edit, clear, or explicitly share/save
    D->>API: Run outcome and optional feedback
    API-->>D: Confirm saved preference, if user opted in
    D-->>A: Return to Talk or Activities
```

No Brain Dump, feeling label, movement choice, or Reach Out draft is implicitly sent to the model. Existing app contracts remain: consent is separate for Journal, Talk excerpt sharing, Continue, and future preference saving. Activity open/complete does not establish helpfulness. API failure should preserve an in-progress local draft only for the current session and show truthful offline status; exiting clears it unless explicit retention was approved.

## 5. Fit with Mira’s current code and product documents

| Area | Current foundation | Planned responsibility |
|---|---|---|
| Canonical activities | `server/interventions/catalog.py` | Maintain the nine IDs/content; add reviewed display metadata and minimal input options. |
| Selection and eligibility | `server/interventions/decision.py`, `eligibility.py` | Keep selection/rules unchanged; no model-authored activities or steps. |
| Activity list | `mobile/src/features/actions/ActionsScreen.tsx` | Replace plain rows with a visual, responsive card/list presentation if library scope is confirmed. Keep saved Continue section explicitly separate. |
| Route/origin | `mobile/src/features/do/DoScreen.tsx`, `mobile/src/app/_layout.tsx` | Preserve activity ID and origin routing; return to Talk or Activities according to approved nav decision. |
| Runner | `mobile/src/features/do/components/InterventionRunnerView.tsx`, `ActivityPanels.tsx`, `ActivityHeader.tsx`, `ActivityOutcome.tsx` | Deliver the reusable visuals and input states, not a separate screen for every activity. |
| Run lifecycle | `mobile/src/features/do/hooks/useInterventionRun.ts` | Preserve start validation, pause, stop, background timer behavior, offline status, optional feedback and explicit save paths; add draft lifecycle and safe local fallbacks. |
| Talk entry | `mobile/src/features/talk/TalkScreen.tsx`, offer components, `useTalkSession.ts` | Continue asking permission before opening Do; keep Talk session intact on return. |
| Talk text/voice | `mobile/src/features/talk/components/TalkTextComposer.tsx`, Talk voice hook/components | Keep Talk composer scoped to conversation. Reuse the approved voice transport only through a separate Do capture component and explicit PTT. |
| Temporary Continue data | `mobile/src/shared/interventions.ts` | Do not broaden persistence implicitly. Confirm Actions/Continue policy first; if approved, ensure only explicitly saved concrete work is retained. |

**Document reconciliation needed:** `PRD/mira_prd.md`, `PRD/mira_v0.03_implementation_plan.md`, and `PRD/product_engineering_review.md` disagree on permanent Actions browsing and Continue. Before implementation, record one authoritative decision and align those documents. Existing code is evidence of current behavior, not product approval by itself.

## 6. Mobile Detox — future candidate, not in the nine

“Mobile Detox” sounds immediately legible, but a blanket abstinence challenge can be moralizing and does not fit every user’s obligations or safety context. A 2024 review reported small pooled improvements in some well-being measures but substantial heterogeneity; a 2025 preregistered meta-analysis of social-media abstinence found no significant effects on positive affect, negative affect, or life satisfaction ([2024 review](https://pubmed.ncbi.nlm.nih.gov/39348315/), [2025 review](https://pubmed.ncbi.nlm.nih.gov/40038410/)).

If explored later, frame it as **“Phone pause”**: user chooses an interval of 1–10 minutes, decides which notifications or essential access to keep, and can stop immediately. Do not request usage-access permissions, inspect app activity, block apps, set streaks, or imply that phone use is a personal failure. Keep it out of this nine-activity implementation until product scope and clinical/privacy review agree.

## 7. Implementation sequence

1. **Resolve product scope:** Confirm Actions library/Continue placement against the PRD and reconcile the three documents. Confirm nine activities remain the demo catalog; Mobile Detox stays future candidate.
2. **Lock activity scripts and states:** Review copy, optional inputs, skip/exit paths, retention wording, and neutral claims with product and Mpower reviewers. Mark content `demo_approved` only for the private synthetic demo; public/pilot status requires clinical, privacy, security, and legal review.
3. **Define catalog contract:** Add only needed presentation metadata and input types. Version the contract; preserve stable IDs; define backend validation and client fallback for old/missing metadata.
4. **Establish design system:** Create one illustration style, card layouts, progress cues, input surfaces, motion tokens, reduced-motion fallback, and accessibility behavior. Build vector assets locally; do not add dependencies unless implementation analysis proves a need.
5. **Upgrade the three runner patterns:** Improve `steps`, `capture`, and `sort` before adding activity-specific behaviors. Complete user input, edit, skip, pause/stop, discard, outcome, return, offline handling.
6. **Wire the nine activities:** Bind catalog metadata to the runner and implement the exact activity flows in §3. Brain Dump typing is first; voice capture is a separately gated follow-up using the existing approved PTT path.
7. **Enrich activity discovery:** If approved, replace static rows in Actions with compact visual cards and intro previews, preserving library ordering/Continue consent and server start validation. Otherwise, expose the same cards only in the approved Talk-led selection surface.
8. **Focused validation:** Run contract tests only for catalog validation/presentation fallbacks, organizer item preservation, consent and draft deletion. Manually walk one activity per runner pattern plus Brain Dump privacy and Reach Out non-send behavior. Complete one end-to-end Android pass on the primary OnePlus and record Android version; check animation smoothness while Talk voice is active.

## 8. Acceptance criteria for the demo

- All nine canonical activities have a distinct visual hook, clear intro, useful interaction, visible skip/stop, and return path.
- `task_reset_60s` preserves original content when sorting/API fails and lets the user choose the final next step.
- `pause_60s` and `short_movement` timers are optional, user-controlled, foreground-only, and stop cleanly.
- `name_a_feeling` supports a user word or skip without scoring or diagnosis.
- `grounding` can be followed, skipped, or exited at any step and does not require watching the screen.
- `brain_dump` supports editable typed content; if voice capture is implemented, mic is off by default and uses hold/release. Draft is discarded unless explicit approved save/share occurs.
- `tiny_next_step` and `sleep_wind_down` allow user-authored, editable options and no commitment/reminder by default.
- `reach_out` never accesses contacts or sends anything; it previews exactly what the user may copy and clears drafts according to explicit choice.
- Existing one-activity offer, consent, server eligibility/start validation, outcome questions, separate preference consent, and outage behavior remain intact.
- Actions navigation is not treated as settled until the contradictory product documents are reconciled.

## 9. Research notes and source list

Research reviewed for activity design and claim boundaries. Evidence is not a substitute for clinical review of Mira’s exact content.

- WHO, *Doing What Matters in Times of Stress: An Illustrated Guide* (2020), includes short grounding and notice-and-name audio examples and a practical exercise guide: [WHO toolkit](https://tdr.who.int/home/our-work/global-engagement/9789240003927); [WHO publication](https://www.who.int/publications/i/item/9789240003927).
- Lieberman et al. (2007), “Putting Feelings Into Words,” laboratory affect-labeling study: [PubMed](https://pubmed.ncbi.nlm.nih.gov/17576282/).
- Wang et al. (2021), meta-analysis of mental contrasting with implementation intentions; small-to-medium estimated effect with caveats: [full paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC8149892/).
- Guo (2023), meta-analysis of expressive writing with long-term follow-ups; small average effect and heterogeneous conditions: [PubMed](https://pubmed.ncbi.nlm.nih.gov/36536513/).
- Hoult et al. (2025), review of positive expressive-writing interventions; reports heterogeneous methods and poor/fair study quality: [PubMed](https://pubmed.ncbi.nlm.nih.gov/40397857/).
- WHO, physical activity fact sheet; general guideline context only, not a prescription for this brief activity: [WHO](https://www.who.int/news-room/fact-sheets/detail/physical-activity).
- CDC/NIOSH (2020), sleep routine information: [CDC](https://www.cdc.gov/niosh/bulletin/2020/sleep.html).
- U.S. Surgeon General, social connection advisory: [PDF](https://www.hhs.gov/sites/default/files/surgeon-general-social-connection-advisory.pdf).
- Ansari et al. (2024), digital detox systematic review/meta-analysis with heterogeneity: [PubMed](https://pubmed.ncbi.nlm.nih.gov/39348315/).
- 2025 preregistered social-media abstinence systematic review/meta-analysis: [PubMed](https://pubmed.ncbi.nlm.nih.gov/40038410/).
- OpenAI Realtime API reference for turn detection configuration: [API reference](https://platform.openai.com/docs/api-reference/realtime-client-events).

**Product decisions still needed:** Actions browsing/Continue policy; whether Brain Dump voice capture is in the first demo slice; visual direction approval; exact final activity copy and Mpower review status.

**Next concrete action:** Product owner confirms the Actions navigation policy and Brain Dump voice scope; then Mpower reviews the nine scripts before implementation begins.
