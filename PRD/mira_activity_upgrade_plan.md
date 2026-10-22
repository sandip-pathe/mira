# Mira activity upgrade plan

Date: 20 October 2026  
Status: AU-00 through AU-17 complete. AU-17 source-reviewed the integration path and produced an installable Android APK; physical walkthrough remains pending on the OnePlus. This plan is the active execution specification; see the linked status ledger.  
Baseline: Existing nine activities, completed Work Orders 00Ã¢â‚¬â€œ12, and the implemented offline first architecture.  
Source: User-supplied activity upgrade proposal, reviewed against the repository. This is a separate plan, not a replacement execution of the old work orders.

## 1. Direction

We do not want to hold back on technology or capabilities. This pitch/demo must make Mira's potential visible and usable: useful AI assistance, beautiful activity canvases, expressive interactions, and sound or touch that contribute to the experience. A technically complete form is not a sufficient activity experience.

Design the strongest coherent experience first. Make concrete engineering decisions to deliver it. Track production hardening separately rather than letting generic future concerns shrink the demo. Any real blocker should be named with a practical alternative and its actual effect on the experience.

The desired progression is: arrive with something difficult, receive useful help doing something with it, and leave with a clearer thread, a chosen action, or a satisfying pause. Each activity should make its purpose apparent through its interaction and visual composition.

## 2. Review of the supplied proposal

| Proposal | Assessment | Development in this plan |
|---|---|---|
| Optional AI actions inside activities | Strongest upgrade. Mira can reduce the work of getting started and finding words. | Specific operations with editable results; no added chat transcript inside each activity. |
| Touch and sound for grounding/breathing | Strong direction for moving attention away from reading instructions. | Designed, optional haptics with an early device experiment; visual and sound guidance can carry the same rhythm. |
| A useful takeaway after reflection | Strong for writing and task activities. | A compact, editable result with a next destination. Do not force a takeaway onto every breathing, movement, or music break. |
| Nine activity upgrades grouped into five work orders | Good coverage, but each order mixes assets, native behavior, AI, and navigation. | Smaller ordered steps, with one complete flagship experience early. |
| Strong physiological and psychological explanations | These are assertions in the source, not established findings from this project. | Use concrete experience descriptions. Do not turn phrases such as "fastest biological brake" or promises of immediate relief into product copy or acceptance criteria. |
| Elaborate haptic textures | Worth exploring; exact rendering varies by device and available API. | Prototype on the OnePlus before writing a sequence around a promised sensation. Add a native dependency when it materially improves the result. |
| AI chooses the best sentence or what to discard | Useful as a suggestion, but a model may misunderstand the writer. | Present editable candidate threads. The person selects what matters and what to put aside. |
| Hold to discard a letter | Good expressive closure. | Offer a satisfying hold interaction plus an ordinary accessible alternative; never rely on an animation alone to explain deletion. |
| Three in-app soundscapes | High demo value and a real offline capability. | Original/licensed audio, quick start, designed transitions, explicit playback controls, coordinated with Talk. |

The plan adds an activity art system, a shared assistance layer, cross-activity handoffs, richer output editing, and a demo sequence. These are needed to turn the proposed features into a coherent product rather than nine separate feature piles.

## 3. What the repository already provides

- Bundled nine-item catalog at `mobile/assets/catalog/activities.json`; Activities and activity starts work locally.
- Nine independent screens/controllers under `mobile/src/features/activities/experiences/`; a compatibility-only Task Reset renderer remains under `activities/legacy/`.
- Device-local Journal, Continue, preferences, and approved excerpts. There is no need to reintroduce server-owned activity runs.
- FastAPI workers in `server/app.py`, including an existing task organizer at `/sessions/{session_id}/task-reset/organize`, transcription, and Journal follow-up.
- Existing OpenAI Realtime/WebRTC Talk and optional held Brain Dump transcription.
- Expo 57, React Native 0.86.3, Reanimated 4.5.1, Worklets 0.10.1, `react-native-svg` 15.15.4, `expo-audio`, SQLite, filesystem, and vector icons. Gesture Handler and haptics were not added for these activity experiences.
- No standalone `AudioCoordinator` file was found. Audio coordination is a proposed capability, not an existing component to call.

Reuse working foundations. The AU-00 architecture review below records the starting point and migration rationale. AU-01 through AU-16 delivered the independent experience architecture; the current code map is in `ARCHITECTURE.md` and the execution ledger.

### AU-00 architecture: baseline findings

The following records the AU-00 starting architecture before migration: `src/app/do.tsx` → `features/do/DoScreen.tsx` → `InterventionRunner.tsx` → `InterventionRunnerView.tsx`, with `features/do/hooks/useInterventionRun.ts`. The current implementation is summarized in `ARCHITECTURE.md`; AU-01 through AU-16 migrated the nine primary screens and isolated the remaining Task Reset compatibility route.

| Current responsibility | Evidence in the implementation | Effect on the proposed experience |
|---|---|---|
| One layout for everything | `InterventionRunnerView` puts activity content inside one `ScrollView` with padding 22, gap 16, and maximum width 704. | A full-screen breathing object, immersive sound scene, and keyboard-focused letter editor all inherit a document/form layout. |
| Every panel mounted together | The view renders Brain Dump, Letter, Grounding, Small Step, Notice & Name, Breathing, Reach Out, Move, and Song panels as siblings; each checks its ID/phase internally. | Inactive panels still run their hooks before returning `null`. This creates unrelated state/effects and makes independent activity ownership harder. |
| Inactive work can still initialize | Brain Dump creates its `TranscriptCapture` instance in an effect before the ID-based render guard; Breathing registers its accessibility subscription before its guard. | Returning `null` does not establish resource isolation. This is not evidence that an inactive panel opens the microphone, but its controller still exists. |
| Shared hook owns unrelated domains | `useInterventionRun` owns draft/reflection, task slips, groups, selected task/cue, grounding counters, countdown state, feedback, Continue persistence, and organizer calls. | Adding five AI operations and richer motion here would expand one state object into a dependency for every screen. |
| Domain stages split across owners | The hook has `loading/ready/active/paused/outcome`; individual panels add their own stages, booleans, clocks, and back handling. | One action can require coordination across generic and activity-specific states, making transitions and cleanup difficult to reason about. |
| Generic presentation leaks into every activity | `ActivityHeader` always adds category, phase pill, title, summary, and status. `ReadyPanel` and `ActivityOutcome` contain multiple ID-based exceptions. Letter content also repeats its own title and description. | Screen composition becomes cluttered; each experience has to negotiate with the shared runner for visual space. |
| Initial state changes after first render | Talk-origin runs can auto-start in an effect. Panels such as Song and Breathing maintain their own start-related state as well. | Different valid intermediate states may briefly render. This is a plausible contributor to the reported flash, not a device-confirmed diagnosis. |
| Completion is coupled to a questionnaire | `finishRun` normally moves into `outcome`, and the shared view selects check-in wording using activity IDs. | It is difficult to end with an envelope release, a useful artifact, or a quiet soundscape ending without another runner exception. |
| Public metadata and renderer patterns are coupled | `shared/activityRegistry.ts` lists patterns such as `steps`, `sort`, and `letter`; generic panels still handle legacy activities. | The new experience must not be limited to a catalog's old presentation pattern. Compatibility belongs at the boundary. |
| The old box is already gone | `ActivityPanel.tsx` is currently a plain `View` with a gap, not a bordered card. | Further removal of that wrapper alone will not solve the generic composition. The runner and activity ownership need changing. |

The local engine in `activityEngine.ts` is useful: it creates local runs and makes terminal transitions idempotent. The catalog, repositories, transcription insertion logic, and existing transfer acknowledgement also provide working behavior to retain during migration.

### Architecture decision: independent experiences, shared capabilities

Each canonical activity becomes a real screen module that owns its composition, stages, controller, and artwork. A small host selects exactly one experience. Shared code handles cross-cutting services and lifecycle contracts; it does not dictate a page template or a fixed sequence of Start Ã¢â€ â€™ Steps Ã¢â€ â€™ Questionnaire.

The public catalog describes what an activity is. The experience registry selects how it is rendered. Keep these separate so public definitions remain usable by the server without importing React or a screen implementation.

```text
src/app/do.tsx                         thin compatibility route; existing links work
src/features/activities/
  library/                            Activities library and Continue presentation
  saved-work/                         typed collections, detail pages, local adapters
  catalog/                            bundled metadata adapters; no screen imports
  runtime/
    ActivityHost.tsx                   resolve ID/entry; mount one experience
    experienceRegistry.ts             canonical ID Ã¢â€ â€™ component and resume adapter
    contracts.ts                      typed entry, run, exit, and handoff contracts
    sessionStore.ts                   temporary active sessions across navigation
    useActivityLifecycle.ts           start/finish/exit; no activity content fields
    navigation.ts                     origin and return destinations
  ui/
    ActivityFrame.tsx                  optional chrome/safe-area building blocks
    ActivityExit.tsx                   consistent close/help affordances
    assistance/                       request affordance and editable result primitives
    motion/                           transitions and reusable interaction primitives
  services/
    assistance/                       typed operations, cancellation, result streaming
    audio/                            explicit audio ownership and playback coordination
    haptics/                          supported cue patterns and cancellation
    timeline/                         elapsed foreground clock and stage scheduling
    handoff/                          selected content and return/acknowledgement
    context/                          scoped app context and preference snapshots
    ranking/                          local library order and shared policy features
  experiences/
    brain-dump/
      BrainDumpScreen.tsx
      useBrainDump.ts
      state.ts
      components/
      art/                            illustration composition and animation bindings
    one-small-step/                    same ownership pattern, only needed files
    grounding/
    paced-breathing/
    notice-and-name/
    unsent-letter/
    reach-out/
    move-scene/
    one-song-break/
  legacy/                             isolated adapters while supported links remain
```

These are proposed boundaries, not a requirement to generate empty folders or duplicate files for every activity. Asset binaries can live in `mobile/assets/activities/<id>/`; React composition belongs with its experience. Existing data repositories can stay at their current paths behind adapters until moving them is useful. The current Actions tab route can remain stable while its implementation moves into `activities/library`.

#### Ownership rules

- **Route:** parse and validate activity ID, origin, Continue/letter ID, and optional handoff ID. Keep existing `/do?id=Ã¢â‚¬Â¦` links as the initial route contract; separate experiences do not require a screen full of redirects. Add a nested route only when a real navigation destination needs it.
- **Host:** normalize legacy IDs, select a component, provide a session, and show a contained invalid-link or resume error. Mount one selected screen keyed by activity/run identity. Do not instantiate the other eight controllers. Synchronous local metadata must not produce a fake server-loading screen.
- **Runtime session:** own run identity, origin/return, started/completed/stopped state, and cleanup registrations. A narrowly scoped in-memory session registry retains active source work across intentional activity handoffs. Close/discard releases it; explicitly kept work uses existing repositories. This is not automatic persistent history.
- **Experience controller:** own its typed content and stage transitions. Brain Dump owns text, source revision, capture state, and threads; Breathing owns pace, elapsed time, and pause; Letter owns editor/read/release and takeaway. Use a reducer/state machine where it clarifies transitions. Do not create a universal `draft/step/busy` object or adopt a state-machine library merely to name phases.
- **Screen:** own layout, its scroll/keyboard behavior, hero position, controls, layers, completion composition, and overlays. `ActivityFrame` offers composable safe-area/chrome pieces; it supplies no compulsory `ScrollView`, padding, status pill, or outcome form. Chrome must be visible in the first painted layout and positioned deliberately for that screen.
- **Services:** provide assistance, capture/playback ownership, timers, haptics, selected-content handoffs, and repository adapters. Pass small typed inputs and callbacks. No experience imports another experience's controller or the old runner hook.
- **Feedback:** retain optional local preference functionality through a reusable hook/component when appropriate. An experience can finish with its designed ending and an optional compact check-in; completing an activity never requires a generic feedback page.

#### Navigation and first-frame behavior

Resolve local metadata and the chosen screen before painting its chrome. Entry from Talk supplies an already accepted entry intent; entry from the library opens that experience's own initial state. Start a breathing/audio session through that experience's explicit action. Avoid rendering a generic ready screen and then replacing it via an auto-start effect.

When Continue needs local hydration, render a stable placeholder matching that activity's eventual composition and keep chrome fixed. A missing or incompatible saved item produces an inline recovery state without pretending that the catalog is remote. Preload the few assets needed by the selected screen; a decorative image arriving must not shift its controls. Test cold and warm entry separately.

Back and exit have one route-level resolution path, with activity-specific decisions supplied by the controller. Register dirty-writing handling, capture cancellation, playback stop, and pending-request cancellation there. Avoid a second independent back handler that pauses or navigates differently. Backgrounding behavior is an explicit policy per experience: pause breathing, suspend a guided timeline, or mark an external-song handoff as away.

A Brain Dump Ã¢â€ â€™ Small Step handoff retains the source session while the destination is on top of it. Back returns to the same draft and result selection. A successful Talk transfer is acknowledged once through the existing transfer mechanism; define whether it closes the source run explicitly. Do not retain entire abandoned experiences indefinitely to simulate navigation continuity.

Retain domain work through typed, per-run snapshots supplied by the experience controller; the shared store need not understand a universal draft format. Restore that snapshot if the source screen remounts. If the router retains an unfocused source route, suspend its media, request side effects, and animation loops on blur; only the focused experience owns those resources. A source retained for an explicit handoff is different from mounting all nine activity modules on every entry.

#### Rendering and interaction architecture

Treat the hero as part of the activity, not an icon above a form. Use layered scenes: illustrated backdrop/material, an interactive object, live content, and stable controls. The activity controller exposes semantic values such as `breathProgress`, `selectedThread`, or `releaseProgress`; artwork reacts to those values without owning saving or navigation.

Plan a capable animation/illustration stack: Reanimated with compatible worklets for interaction-driven motion; Gesture Handler for composed gestures; SVG for scalable, transformable artwork; Skia where a continuous sound landscape, ink field, or ripple shader justifies a canvas. Evaluate authored Lottie/Rive motion for scenes whose quality benefits from a designed animation asset. Select the tools needed for the actual visual concepts during AU-02 rather than accepting stacked `View` shapes as the finish line. Check exact supported versions and official docs before adding packages. Do not install every renderer by default.

Keep high-frequency animation and gesture updates on the appropriate animation runtime rather than rerendering the whole screen every frame. Domain state changes at meaningful boundaries such as a completed breath or selected thread. One foreground timeline drives breathing, cues, and haptics; independent timers must not drift apart. Stop loops and release media on exit. Native additions are a planned build step, not a reason to downgrade the design.

#### AI architecture

AI belongs to the activity's capabilities, with context about the current task and editable output. It should do more than add a row of generic prompt buttons. The experience can offer a useful first operation, then targeted refinements such as "smaller", "more direct", "closer to my words", or a short custom request without opening another chat feed.

Define operation-specific input/result types and keep their prompts, validation, and provider calls in server worker modules rather than expanding `server/app.py` into another monolith. Use a thin request handler plus an activity-assistance dispatcher; reuse authorization/provider plumbing. On the device, each controller selects the operation and interprets its result. Shared request infrastructure owns cancellation, input revision, run identity, retry, and streaming status.

Streaming may reveal complete validated result units as they arriveÃ¢â‚¬â€for example, the first actionable thread before all sections finish. Do not make correctness depend on rendering incomplete JSON. Animate the transition from raw writing to the resulting composition, retain the editable source, and support refinement without replacing the entire screen with a spinner.

An optional activity-aware voice companion can be added after the core typed assistance works: an explicit "Walk me through this" action uses the existing Talk voice path with a selected activity snapshot and the same hold-to-talk control. This is an additional planned slice, not a prerequisite for all nine. It must reuse the current voice session/ownership rather than create another independent voice client inside an activity.

### Migration and retirement

1. Introduce the host, typed session contracts, and registry alongside the existing runner. Migrate Brain Dump first, including its capture controller and result state.
2. Route that canonical ID to the new screen. Keep the remaining IDs behind one clearly marked legacy adapter while their AU steps run. Never mount new and old implementations of the same run together.
3. Migrate Small Step, then each remaining canonical activity in its upgrade step. Replace `ReturnType<typeof useInterventionRun>` props with the narrow experience contracts as each moves.
4. Move library implementation and catalog access into the new feature once its imports are stable; retain public tab and `/do` URLs. Preserve stored Continue versions through explicit decoders; do not require a data reset for a folder move.
5. Retire `InterventionRunnerView`, generic `ReadyPanel`/`StepsActivityPanel` rendering, canonical ID condition chains, and the broad `useInterventionRun` once all canonical experiences are migrated. Move still-supported historical renderers to `legacy/` until their callers/data are deliberately retired.
6. Retain/re-home useful engine, repository, and transfer logic; remove superseded wrappers and duplicate state only after their imports are replaced. The endpoint is independent screens and shared services, not the same runner with renamed files.

Architecture acceptance: opening Grounding does not mount Brain Dump capture or Song listeners; each activity chooses its own screen geometry; adding an AI operation changes its worker/controller rather than a global runner; an activity can end with its own artifact/scene; and entry, resume, handoff, and back do not show intermediate generic UI.

## 4. Experience and visual direction

### A recognizable family, nine distinct experiences

Use the warm ivory/sage palette as a base, with activity-specific accent materials and illustrated objects. Keep dark readable writing, spacious layouts, and a stable exit. Avoid wrapping every activity in the same padded, bordered card. The screen itself is the canvas.

Every activity receives:

1. A purposeful hero object that teaches or embodies the interaction.
2. A primary action immediately understandable from the composition.
3. A visible response to the person's input: a ripple, a gathered thread, a smaller step, a changing envelope, or a sound field.
4. A designed transition between doing, reviewing, and leaving.
5. A compact completion appropriate to the activity, with the next action available without an obligatory feedback questionnaire.

| Activity | Visual material | Signature interaction |
|---|---|---|
| Grounding | Soft light, ripples, three small collected glints | Look up and tap a broad noticing surface |
| Paced Breathing | A soft orb or fabric-like form | A continuous rhythm carried by shape, touch, and optional sound |
| Brain Dump | Loose ink threads becoming a few readable slips | Messy writing transforms into editable threads |
| One Small Step | A large paper task unfolding into a tiny action | Choose a move that fits available effort |
| Notice & Name | A restrained petal/word composition | A feeling opens into more precise words |
| Unsent Letter | Stationery, folded paper, a real envelope composition | Keep a chosen need, then close or release the letter |
| Reach Out | A personal note/message preview | Tone changes immediately reshape the draft |
| Move / Scene | A window, doorway, or moving horizon | A short guided physical sequence or one clear outside-screen mission |
| One Song Break | An illustrated sound landscape | Immediate playback and a gentle visual response |

### Assets and motion

Create a small style board first, then detailed mockups for Brain Dump, Breathing, and Unsent Letter. These span writing, continuous motion, and expressive closure. Carry the approved visual language to the other six.

Use generated illustrations where they improve the result; maintain one art brief, palette, lighting treatment, and silhouette language. Use native/vector composition for objects that must transform interactively. Use image assets for texture and scenes. Keep editable source assets and export sizes documented.

Illustration and animation are committed deliverables in every activity slice, with real creation time allocated. Produce a hero composition, activity states, and an ending for each; do not close a slice with an icon standing in for the promised illustration. Build-time AI image generation can create original backgrounds, object art, and texture variants. Design transforming objects with separate layers so their motion responds to the interaction. Runtime AI creates personalized content and refinements; it does not need to generate a new decorative image to make every entry useful.

Motion should reveal a result or guide a rhythm. Prefer one strong gesture per activity over constant ambient movement. Keyboard appearance, longer text, and smaller screens must be part of the composition. Use a still transition when reduced motion is enabled.

## 5. The nine upgraded experiences

### Grounding: notice through a lens

- Show one short invitation and one visual lens: light/shadow, material, near/far, or color. A shuffle action changes the lens without restarting the activity.
- During noticing, make the main canvas a large tap target. Keep exit, undo, and skip as separate controls whose presses never increment the count.
- A tap produces a restrained ripple and an optional count cue. Show progress so the experience also works with haptics off.
- Move through sight, sound, and contact with a gentle transition. Let the person skip a sense or return a step.
- End with a quiet collected composition and "Back to Talk" / "Finish". Avoid asking them to explain what they noticed.

### Paced Breathing: a rhythm you can follow

- Make the breathing object the main screen content; put settings in a compact drawer.
- Offer equal rhythm, longer exhale, a double-inhale/long-exhale experiment, and own pace. Exact durations are editable design parameters, not physiological promises.
- Add optional touch guidance. A thumb hold activates a clear haptic rhythm where supported; releasing does not accidentally finish the run.
- Make a gentle tempo transition available as an explicit option. Display the selected rhythm; avoid silently changing it.
- Optional soft cues can support eyes-away use. Audio starts only when selected and has an obvious off control.
- Pause on interruption/backgrounding; resume deliberately. No catch-up burst of missed haptics or sound.
- Finish when the person chooses. A concise count or elapsed time may describe what happened without scoring the outcome.

### Brain Dump: let Mira untangle the writing

- Keep immediate free writing and the existing optional voice capture. Prompts stay out of the way.
- Add "Untangle this" on review and where appropriate after writing; do not require an arbitrary word target.
- Produce three editable sections: "What seems heavy", "Could wait for now", and "One thread to follow". Base them on what was written and allow "That doesn't fit" to dismiss a suggestion.
- Keep a clear route back to the raw writing. AI results never replace it.
- Let the person select a thread to open in Talk or take into One Small Step. Carry the selected thread, not an entire dump by default.
- The visual transition gathers loose lines into a few slips; it must work with real variable-length text.
- A put-aside gesture moves a suggestion out of the active view; it does not delete the raw writing or claim to remove a worry.

### One Small Step: get help making a start

- Preserve both entry paths: one known task and a messy collection of things.
- Reuse the organizer where useful. Add "Make this smaller" for the chosen task, generating three concrete options at roughly 30 seconds, 2 minutes, and 5 minutes.
- Describe effort in familiar terms such as "Bare minimum", "A little more", and "If I have room". The percentages in the source imply precision the UI does not need.
- Let the person choose, edit, or request a different set. Do not introduce a required energy questionnaire before helping.
- End in an action card containing the person's chosen move and an optional starting cue.
- "Try now" can open an optional two-minute sand timer with permission to stop. Leaving the phone or returning early counts as a supported path.
- "Keep for later" saves the chosen card locally through Continue. The timer creates no new saved history.

### Notice & Name: find a more precise word

- Selecting a primary feeling expands nearby shades in place; keep the person's selected words visible.
- Offer optional body-location words without turning them into an assessment.
- In the thought-check branch, add "Offer two other angles" using the situation and interpretation the person supplied.
- Return two distinct, tentative angles. Keep the original interpretation visible for comparison.
- Let the person choose, combine, edit, or reject both. The final sentence belongs to them.
- Finish with a small sentence composition; opening Talk carries only the selected wording.
- Offer Keep for a chosen sentence and a local saved-wording detail page; do not save the full thought-check flow automatically.

### Unsent Letter: keep what matters, close the letter

- Give the editor and read view strong stationery composition, comfortable typography, and a visible envelope object.
- Add "Find what I need here" in read view. Generate a short suggested need/boundary and one optional sentence the person could use in Talk.
- Keep both suggestions editable. Never label a generated perspective as what the recipient actually thinks.
- Offer the person a choice to take the selected takeaway into Talk before closing the letter.
- Build the hold-to-release envelope animation with a cancellation window during the hold, optional haptics, and a tap-based equivalent.
- Complete the actual discard through the existing lifecycle. Animation and deletion states must agree; a failed operation must not show a successful release.
- Saved letters remain internal to the letter activity; do not recreate a Saved Letters section in Activities.
- Add explicit Save, Letter home, saved-letter collection, and read/edit pages. Saving retains the letter locally without making it shared context. Talk-origin new letters can open directly into the writer.

### Reach Out: words that sound like me

- Start with intent and an editable message, then offer instant local tone variants: casual, direct, warmer, Hinglish, and an optional no-rush line.
- Add optional "Use what we discussed" when entering from Talk, with an editable view of the relevant context before generation.
- Use AI when contextual rewriting adds value; common starter variants should be immediate and local.
- Show the message as a message-sized object rather than a form with several setup steps.
- Add a system share handoff so the person can choose a messaging app; label it as a handoff, not confirmation that a message was sent.
- Keep Copy out of this implementation: the user previously removed it and placed it in future scope. The supplied plan does not automatically restore it or ExpoClipboard.
- Keep a draft locally only when the person chooses to keep it.

### Move / Change Your Scene: one clear thing to do

- Offer a seated/in-place sequence, a change of spot, or a short walk, with an immediate picture of what each involves.
- For the guided option, use three short stages: soften face/jaw, release shoulders/hands, and look farther away. Let the person skip or stop any stage.
- Use a foreground timeline and optional spoken cues so looking at the screen is unnecessary. Give clear advance notice before audio starts.
- For walking/changing spot, offer a single concrete noticing mission, with a seated alternative always available.
- The away state shows the selected mission, a quiet return action, and optional elapsed time. Do not fill it with extra tasks.

### One Song Break: sound immediately available

- Put "Listen here" alongside existing external music choices.
- Bundle three short original/licensed soundscapes with distinct characters: soft rain/instrumental, gentle pulse, and low textured noise. Audition actual assets before promising them in the UI.
- Give each track its own illustrated scene, a short description, play/pause, remaining time, and volume-aware controls where supported.
- Start promptly from a local file; support replay, stop, and a designed end. Keep external music handoff available.
- For external music, offer listening prompts such as a familiar song, a mood-matching song, or a track to hear without multitasking.
- Coordinate playback with Talk, voice notes, interruptions, headphones, and route changes. Decide background playback explicitly; do not silently enable it as a side effect of this work.

## 6. Shared capabilities that make this coherent

### Activity assistance

Create a small typed assistance contract for `untangle_dump`, `shrink_task`, `offer_angles`, `distill_letter`, and `draft_reach_out`. Each operation has its own input/output schema and prompt. Reuse existing session authorization and worker infrastructure.

The phone calls a worker only when the person requests help. The server performs the requested computation and returns structured data. Normal activity entry, visual assets, local presets, editing, saving, and resuming never wait for a worker.

The shared client handles: idle, requesting, ready, failed, cancelled, and stale result. Keep the draft usable while a request runs. Provide concise retry text inline. Cancel/ignore a result if the person leaves, changes the source, or requests a newer version. Never insert a late result into a different run.

For the demo, one response per operation is sufficient; streaming is optional if it materially improves the wait. Show honest progress immediately, then animate the complete valid result. Avoid a fabricated percentage or treating a canned result as a live model response.

### Result editing and handoffs

Share result editing and action primitives, while each screen owns its result composition. Brain Dump can gather threads, Letter can reveal a need on stationery, and Small Step can unfold an action card. Support edit, choose, retry, and a relevant next action without forcing every result into an identical card layout.

Define a bounded handoff payload with origin activity/run, selected text, optional chosen task/cue, destination, and schema version. Use existing Talk transfer and Continue mechanisms where they already fit. Support Brain Dump Ã¢â€ â€™ Small Step, writing Ã¢â€ â€™ Talk, and Talk Ã¢â€ â€™ contextual Reach Out. Returning from a destination must preserve the originating work while that run is active.

Results are temporary by default. Explicit Keep uses the device repository. This carries forward the user's chosen offline architecture and does not add an account, synchronization system, or remote activity database.

### Touch, motion, and audio

Inventory current behavior first, then introduce a small haptics adapter and playback coordination if needed. The adapter reports supported behavior and has a quiet no-op fallback. A configured breathing timeline should drive visuals, haptics, and optional sound from the same clock.

Use installed primitives where sufficient. Add compatible native libraries when they unlock the designed interaction; do not reject them merely because they require a development build. Check Expo/RN compatibility and official APIs at implementation time. Consolidate selected native additions into an early development-client build, then iterate through Metro.

Audio ownership must be explicit: Talk output/capture, Brain Dump capture, Journal recording, activity cue, or soundscape. Starting an activity sound must not overlap a recording unexpectedly. Releasing ownership does not automatically reopen the microphone.

## 7. Personalization, saved work, shared context, and agentic selection

These are core product capabilities, not optional polish. Plan the navigation and data relationships before building nine separate endings. Personalization should be visible in what Mira remembers, what rises to the top, what it suggests, and how easily a person finds work they chose to keep.

### Current implementation: useful foundations and gaps

- `features/actions/data/preferenceRepository.ts` stores explicit local activity preferences and emits preference-change notifications. The new library must subscribe to those changes so promotion is immediate.
- `features/talk/data/contextRepository.ts` selects approved Journal excerpts and reusable activity preferences. It currently uses English-oriented word matching, returns at most one context match and three preferences, and drops preferences without a keyword match. A greeting/empty query also returns none. This is insufficient for consistent app-wide personalization or Hinglish retrieval.
- `shared/letters.ts` already stores letters locally. `SavedLettersShelf` embeds browsing and editing inside a panel; it is not the dedicated collection/read experience now requested. Preserve useful repository behavior and existing saved records while replacing the presentation.
- `server/app.py` already exposes `retrieve_shared_context`, `choose_support`, and `update_moment_state`. Voice resolves local context on the phone and relays selection to the server; `server/interventions/decision.py` handles selection with catalog/eligibility support. Extend this real path rather than adding a disconnected recommendation demo.

### A. Personalization the person can recognize

Support three distinct inputs:

| Input | Examples | Product effect |
|---|---|---|
| Explicit preferences | Use this again; less often; English/Hinglish; preferred breathing pace; sound/haptics off | Stable defaults, activity ordering, and suggestions adapt consistently across the app. |
| Current moment | What the person just said, available time, a chosen task, a declined suggestion | This session's suggestion and activity entry are relevant; temporary choices do not become a permanent identity. |
| Shared work/context | Approved Journal excerpt, chosen action card, an explicitly shared takeaway | Talk and activity assistance can continue a useful thread without asking the person to repeat it. |

No onboarding questionnaire is required to demonstrate personalization. Start with defaults, learn from explicit choices during use, and provide a compact way to review/change remembered preferences through the existing Journal/settings area. "I turned sound off" must affect every activity that uses sound; it should not require nine separate toggles.

Separate a preferred default from a one-run adjustment. Changing pace during one breathing session does not overwrite the remembered default unless the person chooses to remember it. A preference for a particular activity is not evidence of a diagnosis or a reason to repeat it in every conversation.

### B. Activity outputs need real pages

Distinguish three things in both data and UI:

1. **Active work:** the current run and temporary draft.
2. **Continue:** unfinished work the person deliberately kept to return to.
3. **Saved work:** a completed letter, chosen action, message draft, or takeaway the person deliberately saved and can reopen later.

Completing a run must not remove its deliberately saved output. Archiving a letter must not automatically put its body into Talk context. Saving a chosen takeaway must not silently save the raw source writing.

| Activity | Collection or detail pages | Default behavior |
|---|---|---|
| Unsent Letter | Letter home with New letter and Saved letters; saved-letter list; read page; separate edit state/page | New letters are temporary until Save. Previously saved letters reopen locally with readable typography, date/title, edit, and delete. |
| One Small Step | Saved actions list and action detail; Continue separately for unfinished work | Retain the selected action and cue when kept. Marking an action done can move it to completed saved work instead of making it disappear. |
| Reach Out | Saved drafts list and message detail/editor | Explicit Keep retains the draft. A share handoff does not imply that it was sent. |
| Notice & Name | Saved wording/takeaway list and detail when the person chooses Keep | Preserve chosen wording, not a hidden activity transcript. |
| Brain Dump | A saved selected takeaway can have its own detail view; no raw-vent archive by default | Raw writing remains moment-only. Saving a selected thread does not archive the dump. |
| Breathing, Grounding, Move, Song | Activity-specific defaults/presets and main experience; no mandatory history page | Do not manufacture an archive simply because another activity produces a document. |

Saved letters remain inside the Letter experience, consistent with the earlier removal of a Saved Letters section from the main Activities library. A library entry can lead to an activity home with New / Saved. An accepted Talk offer can open a new editor directly with a secondary Saved route; it should not make the person browse an archive before starting.

Give actual destinations their own thin Expo Router routes: collection, item/read, and editor where needed. Keep the current `/do` entry compatible. Route parameters carry IDs, not entire private documents or serialized AI output. Back from read/edit returns to that collection or active run predictably. A collection/detail page is not another panel appended to the runner.

Introduce versioned, typed saved-work records with an artifact ID, canonical activity ID, kind, title, timestamps, content version, and kind-specific payload. State such as draft/kept/completed belongs in a defined field, not inferred from the existence of text. Keep source references optional; a selected takeaway must survive discarding its raw source. Use per-kind local repository adapters so a generic table never becomes a universal untyped text blob. Adapt existing letters and Continue records; do not require a wipe.

### C. Positive feedback should visibly promote the activity

The user requirement is immediate and concrete: an activity chosen for reuse in feedback appears at the top of Activities.

- Make **Use again** a clear feedback action. It records the local reuse preference and promotes the activity immediately, without another generic review page.
- A positive helpfulness selection can promote it for the current session; Use again makes the preference persist across launches. Neither action saves the private contents of the activity.
- Show promoted activities in a small **Works for you** area above the normal category groups. Exclude those same entries from the groups below to avoid duplicate cards. If none are selected, omit the area entirely.
- Preserve the relative order of the ordinary groups and keep Journal in Express. Continue remains a separate shelf for unfinished work; it is not a recommendation tier.
- Keep multiple promoted items in stable order, most recent explicit Use again first. A later removal/less-often choice changes that activity's preference immediately.
- "Did not help" and "Not sure" must not accidentally promote an activity. Less often reduces proactive suggestions; the activity remains accessible in the library.
- Update subscribers after a committed local write. A failed preference write shows concise recovery and must not claim the new order was saved.

### D. Shared context with explicit exceptions

Create one app-level context service used by Talk, activity assistance, selection, and useful defaults. Repositories remain the sources of truth. Activity code asks for a purpose-specific context snapshot rather than reading unrelated repositories directly.

| Data | Across-app use |
|---|---|
| Language, audio/haptic settings, reusable activity preferences | App-wide defaults and ranking. Available independently of whether a text query happens to mention an activity. |
| Current Talk moment and selected activity handoff | Relevant current-session context, carried into the accepted activity without repeated explanation. |
| Shared Journal excerpts and chosen shareable actions/takeaways | Retrieve relevant portions for the current request with source identity. The app can show why a suggestion used them. |
| Saved private letters, their recipient/body, private letter takeaways | Excluded from general retrieval, ranking, search for AI context, embeddings, and profile summaries. They remain available on their own pages. |
| Raw Brain Dump/venting, unsaved reflections, discarded drafts | Moment-only; excluded from persistent context and personalization extraction. |
| Explicitly selected text shared from an otherwise private activity | Only that selected text enters the specified handoff. It does not make the whole source generally searchable. |

Classify content by purpose/scope in the repository adapter: private work, shared context, or temporary session content. A generated summary of private writing inherits its private scope; summarizing is not a route around the exception. Saving and sharing are separate actions with different product effects. An explicit activity operation such as "Find what I need here" can use its current letter for that requested computation without enrolling the letter in cross-app memory.

Return source IDs, revisions, relevance, and selected text in context snapshots. Deleting/unsharing a source invalidates future retrieval and any derived index. The context resolver must exclude personal/temporary sources before retrieval or indexing, not ask the model to ignore them after receiving them. Existing shared-context revision checks can be extended for this.

### E. Algorithms: define the decisions instead of saying "personalized"

Use distinct policies for browsing order, support selection, context retrieval, and activity adaptation. A single opaque score should not control all four.

**Library ordering:** build the promoted set from the latest explicit reuse state per canonical activity. Sort the set by the time of the latest positive choice, then stable catalog order. Render it above unchanged ordinary groups; deduplicate IDs. Resolve aliases before comparing. Reopening the tab must not reshuffle entries unpredictably.

**Support selection:** first honor the current explicit request and actual available activity capabilities. Then consider current need, practical constraints, remembered preferences, recent declines, and variety. Pass a consistent eligible catalog snapshot and typed preference features to the selector. Known positive reuse can improve a relevant candidate; it must not make an irrelevant favorite win every time. A recent decline suppresses repetition during the conversation. Do not permanently blacklist an activity because one run did not help.

Use a transparent feature-based rerank around the model's semantic judgment. Begin with explicit priority rules and a small versioned score configuration; tune on representative demo scenarios rather than inventing clinically meaningful numbers. Record candidate IDs, policy version, and short non-private decision reasons for local demo diagnostics; do not retain raw letter/vent text to explain ranking.

**Context retrieval:** provide durable preference/default features directly. Retrieve shared content separately using relevance, source type, freshness when useful, and an input budget. Improve the existing English-only token overlap with Unicode-aware normalization and English/Hinglish examples. Add semantic retrieval over eligible shared content if it improves realistic examples; private and moment-only sources never enter that index. Indexes stay device-local; any requested external computation follows the selected-data worker model. Start with a working simple baseline and compare it to semantic retrieval rather than adding infrastructure without a demonstrated gain.

**Activity adaptation:** use current task/content plus relevant preferences to tailor micro-moves, tone, language, pace defaults, and refinements. The operation can ask one useful clarification when needed. Do not require the person to fill out a profile before receiving help.

Algorithm acceptance examples: Use again promotes immediately and survives restart; no preference gives the stable default library; Hinglish wording can retrieve an eligible shared excerpt; a favorite does not override a different explicit request; a recently declined activity is not offered repeatedly; saving a letter never makes it retrievable from Talk.

### F. Backend, tools, and an activity-aware agent

The backend is part of the core experience. The phone owns saved data and rendering; backend workers and the OpenAI agent interpret the moment, call tools, generate/refine artifacts, and propose a suitable next activity. Offline core behavior and capable online orchestration support the same product.

Keep one coherent set of tool/decision contracts for voice and text:

| Capability | Execution owner | Result |
|---|---|---|
| Retrieve useful context/preferences | Device context service, exposed to the conversation tool flow | Purpose-specific shared snippets and stable preference features, with revision/source IDs |
| Determine eligible activity capabilities | Backend catalog/eligibility plus client capability snapshot | IDs and supported entry/assistance capabilities actually available in this client |
| Choose support | Backend `choose_support` orchestration | Listen/clarify or one contextual activity proposal with a concise reason |
| Prepare an activity entry | Typed backend proposal and device resolver | Canonical ID, entry mode, selected task/context reference, and expected return behavior |
| Assist/refine inside an activity | Operation-specific workers | Typed editable result that the activity screen knows how to render |
| Return selected output and optional feedback | Device handoff/event, then bounded conversation input when needed | Talk can continue from the chosen result without receiving raw private activity content |

A real voice journey should be: held speech Ã¢â€ â€™ conversational understanding Ã¢â€ â€™ local shared-context tool if useful Ã¢â€ â€™ backend support selection Ã¢â€ â€™ one spoken offer and matching visible proposal Ã¢â€ â€™ acceptance Ã¢â€ â€™ local activity host with the same contextual entry Ã¢â€ â€™ chosen result/feedback Ã¢â€ â€™ coherent Talk continuation. A suggestion alone does not start an activity. Text uses the same contract and must not invent different rankings or entry behavior.

Give proposals typed `proposalId`, `activityId`, catalog/client compatibility, reason, entry mode, and a bounded context/handoff reference. Show the proposal's actual activity on screen and launch exactly that ID on acceptance. Handle duplicate tool calls and repeated acceptance idempotently. If the person changes direction, invalidate the old proposal instead of opening a stale activity.

The orchestrator can retrieve, clarify, select, and refine through tools as needed; it is more capable than a hard-coded keyword router. Extract it into server modules with adapters for Realtime and text. Keep the existing working tool transport and authorization. Tool failures leave the conversation and current work usable; do not replace the entire app with a loading or offline page.

Integrate activity completion and preference changes into the active moment. Talk may use the fact that a selected action exists or that an activity was chosen for reuse, but gets letter/vent content only through the explicit selected-text route. Do not add a second hidden conversation session inside each activity to obtain agentic behavior.

### G. The UI must explain the product structure

- **Talk:** conversation and one contextual activity offer. Accepted offers enter the intended new run directly.
- **Activities:** promoted Works for you entries, ordinary categories, and a distinct Continue shelf. No private letter previews mixed into this screen.
- **Activity home:** where useful, New plus that activity's saved work. Experiences without saved documents can open directly.
- **Active experience:** purposeful canvas, relevant assistance, and a clear exit. No compulsory detour through saved content.
- **Saved collection Ã¢â€ â€™ detail Ã¢â€ â€™ edit:** real pages with predictable back behavior and an immediate local read path.
- **Journal tab:** preserve the user's existing rule: opens a new entry; Journal from Activities opens Journal home with recent entries and New. Do not accidentally rework this while consolidating activity navigation.
- **Preferences/context controls:** compact access through the existing Journal/settings surface. Editing a preference updates the library and future suggestions; it does not alter or delete saved work.

Show distinct verbs for distinct outcomes: Continue unfinished work, Save a letter, Keep an action, Use again, Share selected text with Talk. Avoid a universal Done button whose data effect depends on hidden activity-specific logic. Do not add screens just because an architectural layer exists.

## 8. Demo priorities and story

Build depth early. Brain Dump is the flagship because it can visibly turn messy input into useful help and feed One Small Step. The second showcase is the breathing/sound experience; the third is the letter's visual closure.

Suggested live sequence using ordinary sample text:

1. Start in Talk with several competing demands and a specific difficult task.
2. Accept Brain Dump, add writing or held speech, then ask Mira to untangle it.
3. Select a thread and open One Small Step. Generate smaller moves, edit one, and try or keep it.
4. Show the saved local action from Continue.
5. Briefly show the distinctive letter interaction and a locally playable soundscape.
6. Disconnect network and show immediate library navigation, writing, grounding, breathing, and bundled playback. Optional assistance clearly offers retry without blocking the activity.
7. Choose Use again in feedback and show that activity promoted at the top of the library; reopen a saved letter through Letter home. Demonstrate a context-aware suggestion without using private letter or raw vent contents.

The demo should use working flows and real requested AI outputs. Prepared sample input is fine; prewritten output must be identified if used as an explicit preview.

## 9. Ordered implementation steps

Use the `AU` IDs below so these steps cannot be confused with the completed original Work Orders 00Ã¢â‚¬â€œ12. Execute exactly one step at a time and stop at its boundary for a brief factual report. Routine choices inside the selected step do not need another permission request.

| Step | Deliverable | Depends on | Completion evidence |
|---|---|---|---|
| AU-00 | Confirm the inspected architecture map; create three detailed visual concepts, the upgrade ledger, asset briefs, and first-frame hypotheses to verify during implementation. | This plan | Source architecture and migration map recorded; Brain Dump, Breathing, and Letter concept board and asset inventory reviewable; no broad blind folder move. |
| AU-01 | Introduce the single-experience host, separate UI registry, typed runtime/session contracts, and optional frame pieces. Extract Brain Dump into its own screen/controller; retain other IDs behind one legacy adapter. | AU-00 | Only the selected controller mounts; Brain Dump owns its layout/state/capture; existing links and draft behavior work; stable first frame. |
| AU-02 | Build the illustration/motion foundation and first interactive art prototypes: breathing object, ink-to-thread composition, envelope. Add the selected gesture/animation/vector/canvas and haptic/audio capabilities; create the needed development-client build. | AU-01 | Real art and working interactions, clear module ownership, and a recorded OnePlus capability check or explicit device gap. |
| AU-03 | Typed saved-work/Continue adapters, context scopes, preference features, deterministic library ranking, and Use again promotion wired to the existing feedback path. | AU-01 | Selected activity rises immediately and stays after restart; private letters/vents never enter general context; existing saved records remain readable. |
| AU-04 | Backend activity-aware orchestration, versioned tool/proposal contracts, and matching device handlers for voice/text, using the new context/preferences service. | AU-03 | A real held-speech conversation retrieves eligible context, proposes one available activity, and launches the exact accepted entry; text follows the same policy. |
| AU-05 | Typed assistance client plus modular server workers; Brain Dump untangling as the first real operation, with refinement and optional validated-unit streaming. | AU-01, AU-03, AU-04 | Actual model result renders into editable sections; source revisions, failure/retry, cancellation, and stale responses work. |
| AU-06 | Finish flagship Brain Dump illustrations, ink/thread transitions, selected-thread handoff, active-source session retention, and saved selected-takeaway detail. | AU-02, AU-05 | Writing Ã¢â€ â€™ untangle Ã¢â€ â€™ refine Ã¢â€ â€™ edit/select Ã¢â€ â€™ Talk works; chosen output reopens independently from the temporary raw dump. |
| AU-07 | One Small Step generation, action-card design, Brain Dump handoff, optional sand timer, Continue resume, saved action list/detail, and completed-action behavior. | AU-06 | Brain Dump Ã¢â€ â€™ generated small move Ã¢â€ â€™ chosen card Ã¢â€ â€™ try/keep completes; back restores the source and saved completed work remains accessible. |
| AU-08 | Grounding lenses, broad tap surface, progress/ripples, optional haptic counts, clear independent controls. | AU-02 | Complete eyes-up sequence and undo/skip/exit work; control taps never count. |
| AU-09 | Breathing object, rhythm options, explicit tempo transition, optional touch/audio cues, remembered defaults, pause/resume. | AU-02, AU-03, AU-08 | Shared timing stays aligned; remembered defaults and per-run changes remain distinct; interruption paths are usable. |
| AU-10 | Notice & Name word expansion, optional body words, two-angle assistance, editable chosen sentence, and saved-wording pages. | AU-02, AU-03, AU-05 | Person can select, edit, reject, keep/reopen, and carry chosen wording to Talk. |
| AU-11 | Unsent Letter stationery/read composition, need extraction, editable takeaway, envelope release, and Letter home/collection/read/edit pages. | AU-02, AU-03, AU-05 | New Ã¢â€ â€™ write Ã¢â€ â€™ save Ã¢â€ â€™ reopen/edit works; saved and unsaved letter content stays outside general context; release cancellation works. |
| AU-12 | Reach Out tone variants, shared-context drafting, editable preview, system share handoff, and saved draft list/detail. | AU-02, AU-04, AU-05, AU-07 | Manual and Talk-origin drafts work; saved drafts reopen; handoff does not claim delivery; Copy stays absent. |
| AU-13 | Move/Scene guided sequence, optional cue audio, concrete missions, away/return composition. | AU-02, AU-03 | Guided and away routes work with stop/skip, interruption, remembered settings, and seated alternative. |
| AU-14 | Original/licensed soundscape assets, three scenes, local playback controls, preferred preset, and external listening prompts. | AU-02, AU-03, AU-13 | Offline play/pause/end, remembered settings, and Talk/audio ownership transitions work. |
| AU-15 | Integrate the finished library, activity-owned collections, preferences/context controls, and end-to-end ranking/context feedback loop across all nine experiences. | AU-07Ã¢â‚¬â€œAU-14 | Coherent New/Continue/Saved navigation; Use again promotes and influences relevant voice suggestions; removed preferences and private content stay excluded. |
| AU-16 | Finish art/transitions across all nine; retire the canonical generic runner/hook/panels after migration; consolidate the Activities feature, preserve legacy adapters/data, update current UX docs, and prepare the demo. | AU-15 | Independent screens and narrow controllers; no inactive activity mounts, placeholder art, repeated default outcomes, or canonical runner exceptions. |
| AU-17 | Focused integration fixes, installable demo build, and short final demo walkthrough. | AU-16 | Voice Ã¢â€ â€™ suggested activity Ã¢â€ â€™ chosen output Ã¢â€ â€™ saved detail Ã¢â€ â€™ promoted preference Ã¢â€ â€™ relevant next suggestion works; offline core and private-source exclusions remain intact. |

Do not start all nine renderers at once. Finish the Brain Dump Ã¢â€ â€™ One Small Step chain before expanding assistance to the other activities. Steps may be combined into a requested batch, but their dependencies still apply.

For AU-06 through AU-14, migrating the target into its independent screen/controller and delivering its illustration/animation states and relevant saved-work pages are part of the step, not optional cleanup after the features. All inherit the AU-01 host. Dependencies describe technical prerequisites; execute the listed sequence one step at a time unless the user requests a batch. AU-15 integrates behavior already delivered in the earlier slices; it does not postpone basic personalization or retrieval until the end.

Optional follow-on AU-18: voice guidance while inside an activity, through the existing Talk session with explicit entry, selected context, and held speech. Deliver one working Brain Dump or Small Step example before extending it; keep the independent screen as the active experience rather than opening a second chatbot. Voice suggesting and launching activities is core AU-04 work, not deferred to this follow-on.

### Checks proportional to the work

Use focused checks for new worker schemas, stale/cancelled responses, data handoffs, and timer/audio ownership where an error would break a flow. Inspect representative rendered states for visual work. One concise OnePlus walkthrough covers touch and audio behavior that code checks cannot establish. Avoid repeated whole-repository lint/test/build cycles for every visual adjustment.

Keep build claims precise: JS rendered, native build compiled, and phone flow exercised are different evidence. The final demo needs the actual phone walkthrough; intermediate slices need only the checks relevant to what changed.

## 10. Decisions to make during the relevant slice

- AU-00: choose the visual treatment from concrete mockups. Default is warm editorial illustration with expressive objects, not repeated cards.
- AU-01: validate screen/controller and runtime ownership against the real Brain Dump flow. Separate pages must control their actual composition, not just wrap the old panel.
- AU-02: audition illustrations, haptics, and motion on the OnePlus; select a compatible stack that delivers the full chosen treatment within the device's performance budget. A dependency/build step is allowed when it unlocks the intended result.
- AU-03: define typed saved-work kinds and private/shared/session scopes; make feedback promotion useful with a stable, explainable ordering policy.
- AU-04: keep voice/text tool schemas, candidate ranking, and proposal acceptance behavior aligned. Reuse the existing tool transport rather than adding a separate conversation engine.
- AU-05: choose model and output limits using a few representative inputs and acceptable latency. Reuse current provider integration unless evidence favors a change.
- AU-11: choose the envelope release animation from a working prototype rather than a description alone; design the saved letter's read page with the same care as the editor.
- AU-14: audition audio assets and decide whether background listening is part of this demo. Default to deliberate foreground playback until the experience is chosen.

Ask the user about a material product preference when it cannot be inferred. Continue independent implementation while optional preferences are pending. Do not turn routine engineering decisions into approval gates.

## 11. Later workstream

Keep a separate follow-up list for wider release: content review, broader device/audio behavior, expanded accessibility coverage, operational controls for AI workers, and additional private-data handling requirements such as PII processing. These are future engineering tasks, not a reason to remove capabilities from this demo.

Future scope also includes restoring Copy if requested, learning richer patterns beyond the explicit personalization in this plan, more sound content, and on-device inference if it improves the actual experience. Core personalization, output pages, shared-context behavior, and backend activity suggestions are included in this upgrade, not deferred to this later list.

## 12. Execution status

AU-00 through AU-17 are complete in code and plan execution. AU-17 reviewed Talk proposal acceptance, local activity output/detail, explicit preference promotion, preference-aware context retrieval, and private-source exclusions; no integration code fix was needed. TypeScript passed and Expo lint passed with zero errors and three existing `require()` warnings. EAS Android `development` client APK build `98c74385-7815-4b1c-bcb8-cefa200903a7` succeeded from the uploaded current workspace snapshot. The EAS Git hash is HEAD metadata; it does not mean the uploaded archive omitted local AU changes. No live provider call or physical OnePlus walkthrough was run. AU-02 visual/performance, AU-06 through AU-16 rendered interaction/audio behavior, and the AU-17 handset walkthrough remain device validation gaps. The original activity build ledger remains the record of Work Orders 00?12; this separate ledger tracks AU work. AU-18 remains the optional in-activity voice follow-on. Execute one AU step at a time and report before continuing.

AU-14 implementation note: the three soundscapes are original, procedurally generated WAV assets bundled for offline playback; playback uses expo-audio playlist looping and pauses on blur/background. No build or device playback verification was run.


AU-15 integration note: reusable preference feedback is shown after eligible completed runs; saved content is limited to the selected activity, rating, and generic reviewed preference text. Temporary and private activity output remains excluded from shared context.

AU-16 implementation note: all nine primary catalog IDs have independent registry entries. The generic renderer is retained only as a narrowly selected historical Task Reset adapter; legacy data adapters are unchanged. No physical rendering or performance claim is made.
