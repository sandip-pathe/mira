# Mira activity upgrade status

**Plan:** [Activity upgrade plan](mira_activity_upgrade_plan.md)  
**Started:** 2026-10-20  
**Current step:** AU-17 - complete; physical device walkthrough pending  
**Next step:** AU-18 - optional follow-on  
**Rule:** Work one AU step at a time. Finish and report the selected step before moving on.

## Step ledger

| Step | Status | Deliverable / evidence | Changed paths | Checks and limits |
|---|---|---|---|---|
| AU-00 | Complete | Inspected current runner, panels, state hook, entry route, library, local preference/context/letter repositories, tool routing, and media references. Recorded architecture findings, migration boundaries, three visual concepts, and asset inventory below. | `PRD/mira_activity_upgrade_plan.md`; `PRD/mira_activity_upgrade_status.md`; `docs/activity-upgrade-concepts.html` | Source review only; no test/lint/build. Concept board is a design reference, not the rendered app or final production art. No Android device/adb attached, so first-frame behavior is not verified on device. |
| AU-01 | Complete | Added an internal experience registry and host. Brain Dump now opens its independent ready/editor screen with a focused local lifecycle; other activities continue through the existing runner. The legacy Brain Dump panel delegates to the extracted editor. Preserved Continue hydration, temporary draft, transcription anchoring/retry, prompt insertion, review, clear confirmation, and Talk excerpt handoff. | `mobile/src/features/activities/runtime/ActivityHost.tsx`; `experienceRegistry.ts`; `ActivityFrame.tsx`; `contracts.ts`; `mobile/src/features/activities/experiences/brain-dump/BrainDumpScreen.tsx`; `BrainDumpEditor.tsx`; `useBrainDumpExperience.ts`; `mobile/src/features/do/DoScreen.tsx`; `components/BrainDumpPanel.tsx`; this ledger; upgrade plan | `npx tsc --noEmit` passed. No rendered/device walkthrough, build, or native behavior check. AU-02 not started. |
| AU-02 | Complete | Added reusable Reanimated/SVG components: phase-linked breathing orb, Brain Dump threads that gather in review, and an illustrated letter/envelope that opens for reading. Android development build `41bb32bd-3f07-4b93-b4d8-776b16a7f8a4` finished; [APK artifact](https://expo.dev/artifacts/eas/mFqcGlFpJZd0deHFvNwnesMI8pMtT5ycoy8OL_8EUfA.apk). | `mobile/package.json`; `mobile/package-lock.json`; `mobile/src/features/activities/art/BreathingOrb.tsx`; `ThoughtThreads.tsx`; `LetterEnvelope.tsx`; Brain Dump editor; breathing/letter panels; Brain Dump Continue initializer; this ledger; plan | TypeScript passed. Expo lint has 0 errors and 3 existing `require()` warnings. Expo compatibility check flags four existing patch versions. No `adb`/OnePlus device available, so no device visual/performance check or install confirmation. |
| AU-03 | Complete | Added typed saved-work/Continue scopes, shared context service, durable preference features, deterministic Ã¢â‚¬Å“Works for youÃ¢â‚¬Â ranking, and explicit Ã¢â‚¬Å“Use againÃ¢â‚¬Â feedback wording. Promoted activities are removed from their normal group; removal markers prevent older preferences from resurfacing. | `mobile/src/features/activities/data/savedWork.ts`; `mobile/src/shared/context/*`; `mobile/src/features/talk/data/contextRepository.ts`; `conversation.ts`; `mobile/src/features/actions/ActionsScreen.tsx`; `mobile/src/features/actions/data/preferenceRepository.ts`; `mobile/src/features/do/components/ActivityOutcome.tsx`; voice and Talk session context callers; this ledger; plan | `npx tsc --noEmit` passed. `npx expo lint` passed with 0 errors and 3 existing `require()` warnings. No build or device check. Saved letters and existing Continue records retain their original storage format and remain readable. |
| AU-04 | Complete | Added versioned voice tool and proposal contracts, explicit preference context for voice and text, device-side validation against the installed activity catalog, and proposal-ID-bound acceptance. Voice and text continue through the same server selector and eligibility/capability policy. | `server/app.py`; `server/interventions/decision.py`; `mobile/src/shared/voice.ts`; `mobile/src/shared/interventions.ts`; `mobile/src/features/talk/data/orchestrationContract.ts`; `mobile/src/features/talk/hooks/useTalkSession.ts`; `mobile/src/features/talk/TalkScreen.tsx`; this ledger; plan | `npx tsc --noEmit` and `npx expo lint` passed; lint has 0 errors and 3 existing `require()` warnings. Python syntax compilation passed. No server test suite, live voice/text request, device walkthrough, or build was run. |
| AU-05 | Complete | Added the typed assistance client and modular stateless server worker for explicit Brain Dump untangle/refine requests. Review can show editable notes, dismiss a mismatch, refine, retry, or cancel. Raw writing remains visible and unchanged; response identity and source revision prevent stale output. | `server/workers/activity_assistance.py`; `server/workers/__init__.py`; `server/app.py`; `mobile/src/features/activities/assistance/assistanceClient.ts`; `mobile/src/features/activities/experiences/brain-dump/DumpUntangling.tsx`; `BrainDumpEditor.tsx`; this ledger; upgrade plan | TypeScript and Expo lint passed (0 errors; 3 existing warnings); Python compilation and route registration passed. No build, worker tests, live model request, or device walkthrough. |
| AU-06 | Complete | Finished Brain Dump thread selection and handoff. Selected takeaways save locally into a dedicated collection, appear under Activities > Saved takeaways, and reopen on an independent detail screen without the temporary raw dump. Talk opens above the activity so returning preserves the live source session. Added selection-aware ink-thread emphasis. | `mobile/src/features/activities/art/ThoughtThreads.tsx`; `experiences/brain-dump/DumpUntangling.tsx`; `BrainDumpEditor.tsx`; `mobile/src/shared/savedTakeaways.ts`; `mobile/src/shared/storage/*`; `mobile/src/features/activities/data/savedWork.ts`; `mobile/src/features/actions/ActionsScreen.tsx`; `mobile/src/app/saved-takeaway.tsx`; `mobile/src/features/do/DoScreen.tsx`; this ledger; upgrade plan | TypeScript passed. Expo lint passed with 0 errors and 3 existing warnings. `git diff --check` passed; server unchanged. No build or device walkthrough; stack return and rendered detail remain to review. |
| AU-07 | Complete | Added an independent One Small Step experience, stateless shrink-task assistance, Brain Dump/saved-takeaway handoff, optional 2-minute timer, Continue resume, and saved action list/detail with tried/not-tried outcomes. | `server/workers/activity_assistance.py`; `mobile/src/features/activities/assistance/assistanceClient.ts`; `mobile/src/features/activities/experiences/one-small-step/*`; `mobile/src/features/activities/art/SmallStepScene.tsx`; `mobile/src/shared/activityHandoff.ts`; `mobile/src/shared/savedActions.ts`; `mobile/src/shared/storage/migrations/005-saved-actions.ts`; `mobile/src/app/saved-action.tsx`; `mobile/src/features/actions/ActionsScreen.tsx`; `mobile/src/features/do/DoScreen.tsx`; this ledger; upgrade plan | `npx tsc --noEmit`, `npx expo lint` (0 errors; 3 existing `require()` warnings), and Python syntax compilation passed. No build, worker tests, live AI request, or device/rendered walkthrough. |
| AU-08 | Complete | Added independent Grounding screen/controller with the existing See/Hear/Feel sequence, tap-to-count illustration, undo/skip/previous/continue/leave controls, completion summary, and explicit local reuse preference. | `mobile/src/features/activities/experiences/grounding/*`; `mobile/src/features/activities/art/GroundingScene.tsx`; `mobile/src/features/activities/runtime/experienceRegistry.ts`; this ledger; upgrade plan | `npx tsc --noEmit` and `npx expo lint` passed (0 errors; 3 existing `require()` warnings). `git diff --check` passed. No build or rendered/device walkthrough. Optional haptics omitted; no haptics package is installed. |
| AU-09 | Complete | Added a standalone paced-breathing experience with four rhythms, deliberate rhythm transitions, pause/resume, reduced-motion handling, optional Android vibration and offline audio cues, and locally remembered defaults. | `mobile/src/features/activities/experiences/paced-breathing/*`; `mobile/src/features/activities/runtime/experienceRegistry.ts`; `mobile/src/shared/storage/migrations/006-breathing-preferences.ts`; `mobile/src/shared/storage/database.ts`; `mobile/assets/audio/breath-*.wav`; `mobile/app.json`; this ledger; upgrade plan | `npx tsc --noEmit` passed. `npx expo lint` passed (0 errors; 3 existing `require()` warnings). `git diff --check` and app.json JSON parse passed. No build or rendered/device walkthrough; optional cues and interruption behavior remain unverified on device. |
| AU-10 | Complete | Added independent Notice & Name feeling/shade selection, optional body words, user-edited sentence, two-angle AI request from user-entered situation and interpretation, accept/combine/edit/reject controls, and private locally saved wording list/detail with Talk handoff. | `mobile/src/features/activities/experiences/notice-name/*`; `mobile/src/features/activities/assistance/assistanceClient.ts`; `mobile/src/features/activities/runtime/experienceRegistry.ts`; `server/workers/activity_assistance.py`; `mobile/src/shared/savedWordings.ts`; `mobile/src/shared/storage/migrations/007-saved-wordings.ts`; Actions list; saved-wording route; `savedWork.ts`; this ledger; plan | `npx tsc --noEmit` passed. `npx expo lint` passed (0 errors; 3 existing `require()` warnings). Server worker syntax parse and `git diff --check` passed. No worker tests, live AI request, build, or device walkthrough. |
| AU-11 | Complete | Added an independent Unsent Letter experience with stationery composition, optional prompts/word count, explicit local save/read/edit collection, and a staged envelope release with discard confirmation. Optional AI takeaway sends only the letter body on explicit request, returns editable need/boundary and Talk line fields, and hands off only the selected excerpt. | `mobile/src/features/activities/experiences/unsent-letter/*`; `mobile/src/features/activities/art/LetterEnvelope.tsx`; `mobile/src/features/activities/runtime/experienceRegistry.ts`; `mobile/src/features/activities/assistance/assistanceClient.ts`; `server/workers/activity_assistance.py`; this ledger; plan | `npx tsc --noEmit` passed. No build, live worker request, rendered/device walkthrough, or server test was run. Saved letter collection uses the existing on-device repository. |
| AU-12 | Complete | Acceptance review confirmed manual/Talk entry, opt-in reviewed context rewrite, editable preview, save/reopen/edit, native share handoff, delivery-neutral copy, and no Copy action. No AU-12 implementation gap remained. | `mobile/src/features/activities/experiences/reach-out/*`; `mobile/src/features/activities/runtime/experienceRegistry.ts`; `mobile/src/features/talk/hooks/useTalkSession.ts`; `mobile/src/shared/reachOutContextHandoff.ts`; `mobile/src/shared/reachOutDrafts.ts`; migration `008-saved-reach-out-drafts.ts`; `mobile/src/app/saved-reach-out.tsx`; `savedWork.ts`; assistance client and worker; this ledger; plan | `npx tsc --noEmit` and `npx expo lint` passed (0 errors; 3 existing `require()` warnings). No build, live worker request, rendered/device walkthrough, or server tests. Native Share is a user-controlled share-sheet handoff. |
| AU-13 | Complete | Added an independent Move / Change Your Scene flow with accessible walk, seated movement, change-of-spot, custom, and stay options; explicit skip/stop; an away screen and return composition; optional elapsed clock and short local start/return cues; and opt-in device-local remembered choice/settings. Background/resume returns to the active activity screen; the cue players pause outside the foreground. | `mobile/src/features/activities/experiences/move-scene/*`; `mobile/src/features/activities/art/MoveSceneArtwork.tsx`; `mobile/src/features/activities/runtime/experienceRegistry.ts`; `mobile/src/shared/storage/migrations/009-move-scene-preferences.ts`; `mobile/src/shared/storage/database.ts`; `mobile/assets/audio/move-*.wav`; this ledger; plan | `npx tsc --noEmit` and `npx expo lint` passed (0 errors; 3 existing `require()` warnings). No build, rendered/device walkthrough, or audio interruption test. All choices/settings are stored locally; no server request is used. |
| AU-14 | Complete | Added three original bundled offline soundscapes with animated scene art, looped playback controls, local preferred-scene storage, and optional manual/allowlisted music-app handoff. Playback pauses on blur/background; Talk audio handoff is staged when appropriate. | `mobile/src/features/activities/experiences/one-song/*`; `mobile/src/features/activities/art/SoundscapeScene.tsx`; `mobile/src/features/activities/runtime/experienceRegistry.ts`; `mobile/src/shared/storage/migrations/010-soundscape-preferences.ts`; `mobile/src/shared/storage/database.ts`; `mobile/assets/audio/soundscape-*.wav`; this ledger; plan | `npx tsc --noEmit` and `npx expo lint` passed (0 errors; 3 existing `require()` warnings). No build, device playback/interruption check, or rendered walkthrough. Playback assets are locally generated; no external licensed audio used. |
| AU-15 | Complete | Integrated New/Continue/Saved destinations with the local Activities library, activity-owned Letter and Reach Out collections, saved-output details, Journal preference controls, and promoted activity ranking. Added reviewed optional reuse feedback to eligible completed independent experiences; the saved signal includes only activity ID, rating, and generic preference text. Talk/text suggestion context consumes explicit local preference features. | `mobile/src/features/activities/components/ActivityPreferencePrompt.tsx`; independent experience screens/controllers; `mobile/src/features/actions/ActionsScreen.tsx`; `mobile/src/features/activities/data/savedWork.ts`; local context/preference services; this ledger; plan | `npx tsc --noEmit` and `npx expo lint` passed (0 errors; 3 existing `require()` warnings). No build, provider request, or rendered/device walkthrough. Temporary Brain Dump content and letter/message content remain outside general context. |
| AU-16 | Complete | Consolidated the active route, catalog, run lifecycle, music-link validation, excerpt handoff, art, local data, and assistance under `features/activities`. All nine primary IDs resolve to their independent screens. Retained only a compatibility adapter for `task_reset_60s`, limited its renderer to that flow, and removed the unused canonical panels/legacy letter shelf. Added stateful Notice & Name bloom and Reach Out note artwork; refreshed architecture and demo docs. | `mobile/src/features/activities/ActivityRouteScreen.tsx`; `runtime/*`; `data/*`; `components/*`; `art/NoticeNameArtwork.tsx`; `art/ReachOutArtwork.tsx`; `experiences/*`; `legacy/*`; `mobile/src/app/do.tsx`; `ARCHITECTURE.md`; `docs/nine_activity_demo_checklist.md`; this ledger; plan | `npx tsc --noEmit` passed. `npx expo lint` passed with 0 errors and 3 existing `require()` warnings. No build, rendered/device walkthrough, or performance check. |
| AU-17 | Complete (source review and installable build; phone walkthrough pending) | Reviewed Talk proposal acceptance, local activity execution/saved detail, preference promotion, preference-aware context retrieval, and offline exclusions. No additional code fix was needed. Built Android development-client APK `98c74385-7815-4b1c-bcb8-cefa200903a7` from the current workspace snapshot. | Talk proposal acceptance/context retrieval; activity preference/context services; `docs/nine_activity_demo_checklist.md`; this ledger; plan | `npx tsc --noEmit` passed. `npx expo lint` passed with 0 errors and 3 existing `require()` warnings. EAS Android `development` build succeeded. Physical walkthrough is yours to run; no device checks were claimed here. No live AI request or OnePlus/physical walkthrough; install and run the documented short path before demo. EAS Git hash identifies HEAD metadata; the uploaded build archive contained the current workspace changes. |
| AU-17-AU-18 | Planned | See the ordered plan. | - | - |


## Architecture audit and migration map

Observed route and composition: `src/app/do.tsx` Ã¢â€ â€™ `features/do/DoScreen.tsx` Ã¢â€ â€™ `InterventionRunner` Ã¢â€ â€™ `InterventionRunnerView` Ã¢â€ â€™ nine activity panels plus shared header, ready panel, paused panel, and outcome form.

Observed state ownership: `useInterventionRun` combines run lifecycle, Continue hydration, saved preference feedback, generic draft/reflection, task slips and sorting, Small Step fields, Grounding counts, and timer state. Activities also retain important local controllers: Brain Dump's transcription anchoring/retry, Breathing's foreground clock/accessibility/back behavior, Letter's save/read/release state, and each panel's artwork/layout.

Observed first-frame risk: catalog data is bundled, but the renderer places an asynchronous Continue hydration path under a `ScrollView`; Talk-origin activities can also transition from ready to active in an effect. Every panel is invoked in the shared render tree and then performs its own identity/phase guard; Brain Dump and Breathing register effects before returning `null`. These are concrete candidates for unnecessary mounting and entry-state transitions. They are not a confirmed device root cause.

Migration decisions:

1. Keep `/do` and existing activity ID/origin/Continue/letter parameters as the compatible entry while introducing an internal UI registry.
2. Put the library, saved-work destinations, runtime host, services, and individual experiences under `features/activities` incrementally. Keep shared catalog contracts free of screen imports.
3. Move Brain Dump state/capture/rendering into the first independent experience. Preserve transcription request identity, source revision checks, selection/caret insertion, hold-to-speak, retries, clear confirmation, Talk excerpt handoff, and local temporary draft behavior.
4. Leave other canonical IDs on the old adapter until each is migrated. One host renders one selected activity; other panels/controllers do not mount for the active entry.
5. Add small lifecycle and session interfaces for the host, but keep activity-specific state in typed experience controllers. Do not port the generic hook under a renamed filename.
6. Retain `activityEngine.ts` terminal idempotency, Continue and preference repositories, `TranscriptCapture`, and the existing Talk-transfer acknowledgement behind narrow adapters.
7. After the activity migrations, remove the old canonical `InterventionRunnerView`, generic ActivityPanels branches, and broad `useInterventionRun`. Isolate only genuinely supported historical renderers in `legacy/`.

## Visual concepts prepared

See [Activity upgrade concepts](../docs/activity-upgrade-concepts.html) for the responsive three-screen concept board. It uses CSS/SVG artwork as a reviewable composition study; these are mock screens and source geometry, not final React Native components or image assets.

| Activity | Concept and screen composition | Motion/art direction | Key states to design next |
|---|---|---|---|
| Brain Dump | Ink-and-paper page, spacious writing canvas, floating snippets gathering around a quiet central point, hold-to-speak control, clear read-back action. Keyboard replaces available canvas height while the exit and voice action remain accessible. | Fine botanical/ink threads connect loose thought slips. On requested untangling, strands gather into three editorial result regions that keep the raw writing available. | Empty/editor, focused keyboard, holding/recording, transcribing/retry, review, editable AI result, selected handoff, exit confirmation. |
| Paced Breathing | Unboxed full-screen breathing scene, centered layered sage orb with concentric rings/orbits, one phase instruction, accessible pause/finish controls, collapsed pace settings. | Soft internal light expands and contracts; subtle orbit and ambient scene depth. Optional touch/audio cues follow the same timeline. | Ready, each breathing phase, own pace, pause/background, resume, settings, completed cycle, finish. |
| Unsent Letter | A true stationery composition with a botanical margin illustration, readable letter sheet, visible save action, selected takeaway, and an envelope anchored at the bottom. Separate Letter home, collection, read, and edit pages. | Small botanical details; letter visibly folds into and seals inside an envelope on a cancelable hold. Tap alternative produces the same clear ending. | New/edit, keyboard, read, AI-suggested need, selected Talk handoff, save/update, collection empty/list, read, edit, hold/cancel/released, delete confirmation. |

The board demonstrates the art direction and hierarchy only. Native layouts must be re-composed for Android safe area, keyboard, font scaling, Talk-origin controls, and actual screen dimensions during their implementation slices.

## Asset and capability inventory

| Asset/capability | Present now | AU direction |
|---|---|---|
| Bundled activity catalog | `mobile/assets/catalog/activities.json` | Keep catalog metadata independent of screen implementations. |
| General app brand/adaptive icons | `mobile/assets/icon.png`, `favicon.png`, Android icon variants | App chrome only; not activity-specific hero art. |
| Activity raster/vector asset directory | None found under `mobile/assets` | Create `mobile/assets/activities/<id>/` when authored assets are ready; document source, license, variants, and target state. |
| Grounding illustration | `GroundingIllustration.tsx`, composed from native Views | Revisit as a full-screen ripple/light scene; no dedicated image asset currently. |
| One Small Step illustration | `SmallStepScene.tsx`, composed from native Views/SVG | Activity-owned card slips into a first-move card with a short Reanimated transition; timer remains optional and is not a reminder. |
| Notice & Name illustration | `NoticeNameIllustration` in `NoticeNamePanel.tsx`, floating word shapes | Evolve into stateful word/petal composition. |
| Breathing art | `PacedBreathingPanel.tsx`, nested Views/Animated value | No dedicated scene asset; design layered hero object and expressive states. |
| Brain Dump art | `BrainDumpPanel.tsx`, small decorative dots and ruled input | No dedicated art asset; create original ink/thread hero and transformation states. |
| Letter art | `LetterActivityPanel.tsx`, installed envelope icon in a tinted rectangle | No dedicated asset; create stationery, botanical branch, envelope and seal states. |
| Music/away scenes | `MoveSceneArtwork.tsx`, `SoundscapeScene.tsx`, bundled local WAV files | AU-13 owns its away/return scene and cues; AU-14 adds three original offline soundscapes. |
| Motion/gesture dependencies | Reanimated 4.5.1, Worklets 0.10.1, and SVG are installed; no Gesture Handler or haptic package was added for these concepts. | Continue with focused illustrations and state transitions; validate performance on the OnePlus when available. |
| Audio API | `expo-audio` is installed; a standalone `AudioCoordinator` was not found | AU-09/AU-13/AU-14 define cue/playback ownership, interruption, focus/background, and stop behavior within each activity. |
| AI worker | Modular stateless activity assistance worker supports Brain Dump untangle/refine and One Small Step shrink-task operations; OpenAI Realtime tool selection remains in the existing voice path. | Add operation-specific worker schemas; clients validate response identity and revisions. |

## AU-01 checkpoint

- The new host routes canonical `brain_dump` to its independent screen; other IDs fall back to the existing runner.
- The library entry starts from an activity-owned ready screen; Talk-origin entries begin directly in the editor without an effect-driven phase transition.
- The extracted editor is shared with the legacy panel adapter, avoiding duplicate capture behavior.
- Continue hydration and Talk excerpt transfer remain supported.
- TypeScript passed; first-frame/device behavior was not visually verified in AU-01.

## AU-02 checkpoint

- Added SDK-compatible Reanimated and SVG capabilities and three reusable illustration/motion prototypes in actual activity screens.
- Reanimated 4.5.1 and Worklets 0.10.1 were checked after Expo's SDK-matched install; no Gesture Handler, haptics, audio, or canvas dependency was added for these prototypes.
- TypeScript passed; Expo lint reported only three existing `require()` warnings elsewhere.
- Android dev build `41bb32bd-3f07-4b93-b4d8-776b16a7f8a4` finished; APK artifact is linked in the ledger. EAS uploaded the current local project directory; the displayed Git hash identifies HEAD metadata.
- `adb` and Android SDK paths are unavailable, so OnePlus visual/performance validation remains an explicit device gap.
- AU-03 implementation is complete. No Android build was run for AU-03.

## AU-03 checkpoint

- Added typed local saved-work adapters. Letters are private; Continue records are private by default, and Brain Dump Continue content is additionally marked session-only for context purposes. No private work source is included in general context retrieval.
- Added purpose-scoped shared context retrieval. It reads approved Journal excerpts and explicit reuse preferences only; reusable preference features are available even when a query has no keyword match. Hinglish/Unicode tokenization uses normalized letter/number tokens.
- Ã¢â‚¬Å“Use againÃ¢â‚¬Â writes to the existing device preference store. The Actions library now shows Ã¢â‚¬Å“Works for youÃ¢â‚¬Â above category groups, orders it by latest explicit choice with stable catalog ties, and refreshes after feedback changes. Preferences are canonicalized across legacy IDs.
- Stop/delete updates the latest state; deletion clears the saved lesson and leaves a minimal local marker to prevent an older choice from returning.
- TypeScript and Expo lint passed. Lint still reports three existing `require()` warnings. No build or device validation was run.

## AU-04 checkpoint

- Versioned the Realtime tool argument contract and support-decision/proposal response. Server tool registration and relay responses carry the matching contract version; malformed or unsupported versions are rejected.
- Voice context retrieval now receives the same bounded, on-device-approved preference features as text. The server text reply also receives those explicit preferences, alongside the existing bounded shared-context excerpts.
- Both modalities use the existing capability-filtered server selector. The device validates proposal version, activity availability, and selected/ranked ID consistency, then resolves the ID from its own bundled catalog.
- UI and spoken/text acceptance are bound to the exact pending proposal ID. Acceptance opens that proposalÃ¢â‚¬â„¢s canonical activity; it does not accept a later or mismatched suggestion.
- TypeScript, Expo lint, and Python syntax compilation passed. No build, server tests, live provider request, or physical-device walkthrough was run.
- AU-05 is complete in code; no build was run.

## AU-05 checkpoint

- Brain Dump review keeps the temporary raw writing visible and untouched. Ã¢â‚¬Å“Untangle thisÃ¢â‚¬Â is optional and only runs after an explicit tap.
- Added a versioned, operation-discriminated assistance contract and modular server worker. Model calls are stateless (`store: false`) and no activity content is written to server storage.
- Refinement receives current edited notes, dismissals, and the personÃ¢â‚¬â„¢s adjustment. Dismissed fields are forced empty in the worker response.
- The client validates echoed request/run/revision/operation before rendering. Leaving the panel cancels; source changes and newer requests invalidate the old response. Failure leaves raw writing available with retry.
- TypeScript, Expo lint, and Python syntax compilation passed. No build, tests, live provider request, or device walkthrough was run; model latency/output and rendered interactions remain unverified.

## AU-06 checkpoint

- Brain Dump sections are selectable. The selected thread can be handed to Talk as a one-time transfer or saved separately on device.
- Saved takeaways have their own SQLite collection, migration, validation, list entry, delete action, and detail route. They are `private_work` and excluded from shared-context retrieval. The detail contains only the chosen note, not the raw Brain Dump.
- Opening Talk now pushes it above the Brain Dump route. Returning to the activity preserves its in-memory temporary source session.
- Ink-thread art emphasizes the selected note while keeping its gathered/loose transition.
- TypeScript and Expo lint passed (0 errors; 3 existing warnings). No build or rendered/device walkthrough was run.

## AU-07 checkpoint

- One Small Step now has its own screen/controller and activity-owned card scene with a state transition; the legacy illustration remains available to the legacy adapter.
- A selected Brain Dump thread or saved takeaway opens the task editor through a one-time in-memory handoff. The raw Brain Dump screen stays underneath for return.
- The user can request one first-move idea from the modular stateless worker, edit the action card, optionally use a two-minute timer, and save locally to Continue or Saved actions.
- Continue resumes the saved card. Completion records tried/not-tried locally, and saved action detail can be reopened, updated, or removed.
- TypeScript and Expo lint passed (zero errors; three existing `require()` warnings); Python syntax compilation passed. No build, live provider request, worker tests, or rendered/device walkthrough was run.

## AU-08 checkpoint

- Grounding now runs on its own screen and local controller. Talk enters the active guide; Activities shows a short intro first.
- See/Hear/Feel retain their existing 3/2/1 counts. The artwork is a large labeled tap target, while notice, undo, skip, previous, continue, and exit controls stay outside it.
- The final screen summarizes counts, offers the existing optional check-in and explicit local Ã¢â‚¬Å“Use againÃ¢â‚¬Â preference, then returns to the original route.
- Short ripples respect reduced-motion settings. Haptics were not added because the optional capability is not installed.
- TypeScript and Expo lint passed (zero errors; three existing warnings). No build or rendered/device walkthrough was run.

## AU-09 checkpoint

- Paced Breathing now has its own screen/controller with even, longer-exhale, two-inhale, and own-pace rhythms. Rhythm changes during a run are explicit and restart from a fresh inhale.
- Pause/resume and app interruption share the activity clock; leaving the screen does not save breathing content. Reduced-motion mode keeps the orb still.
- Default rhythm and optional cue choices are stored in device-only SQLite. Touch vibration and locally bundled soft audio cues are off by default; vibration is Android-only.
- TypeScript and Expo lint passed (zero errors; three existing `require()` warnings). No build or rendered/device walkthrough was run.

## AU-10 checkpoint

- Notice & Name now runs as an independent screen. Selecting a feeling reveals nearby shades in place; optional body-location words feed an editable sentence.
- The optional Ã¢â‚¬Å“two other anglesÃ¢â‚¬Â request uses only the situation and interpretation entered for that request. The original interpretation stays visible; the person can choose one, combine, edit, or reject both.
- Only an explicitly kept sentence is saved, in a device-only SQLite table. Saved wording has its own Actions list and detail page, remains private, and only the selected sentence is handed to Talk.
- TypeScript and Expo lint passed (zero errors; three existing `require()` warnings). Worker syntax parse passed. No worker test, live AI request, build, or rendered/device walkthrough was run.

## AU-11 checkpoint

- Unsent Letter is an independent screen with home, collection, read, and edit states. Save is explicit and uses the device letter repository; the general context service does not include letters.
- Optional body-only assistance returns editable takeaway fields. Only a chosen excerpt can transfer to Talk; the letter remains private.
- Release art is animated and discard requires explicit confirmation. TypeScript passed; no build, live worker request, or device walkthrough.

## AU-12 checkpoint

- Reach Out has local starters and tone variants, an editable draft/review flow, and optional Talk context that is opt-in, visible/editable, in-memory, and only sent to the stateless rewrite worker on explicit request.
- Saved drafts use a dedicated device-only SQLite table and independent detail route. Native Share opens the OS share UI; the app does not claim the message was delivered and exposes no Copy action.
- TypeScript and `git diff --check` passed. No build, live worker request, server tests, or rendered/device walkthrough.

## AU-13 checkpoint

- Move / Change Your Scene runs independently from the generic runner. It offers walk, gentle seated movement, changing spots, a custom break, or staying in place, with explicit skip and stop.
- The away screen has a clear return action; app interruption returns the activity to its check-in state. Elapsed time is optional and shown only when its measurement is reliable.
- Optional original start/return tones are bundled locally and pause outside the foreground. Remembered choice, elapsed-time visibility, and cue settings are device-local and explicit.
- TypeScript and Expo lint passed (0 errors; three existing `require()` warnings). No build or rendered/device/audio interruption walkthrough.

## AU-14 checkpoint

- One Song Break now has three bundled, original offline scenes: rain, canopy, and shoreline. Playback loops with play/pause/end controls; scene art responds to playback and reduced-motion settings.
- A preferred scene is saved in device-only SQLite. External listening remains optional and user initiated; music links are HTTPS-validated against the existing allowlist. Mira does not claim to detect external playback.
- Local audio pauses on route blur or app background and never resumes automatically. The Talk-origin handoff is staged through the existing audio return mechanism.
- TypeScript and Expo lint passed (0 errors; 3 existing 
equire() warnings). No build, rendered/device walkthrough, or physical audio interruption check was run.


## AU-15 checkpoint

- Reviewed the Activities library, Continue list, saved output pages, activity-owned letter/draft collections, Journal preference controls, and the shared context/recommendation path. The existing routes form a complete local navigation loop; private output stays in its own collection.
- Completed independent experiences share an optional rating and reviewed reuse choice; Grounding retains its existing equivalent. Preference retrieval uses activity identity and generic, user-approved preference text. It never includes the activity's private output.
- Temporary Brain Dump and unsent letter/message content are not promoted to shared context. Reach Out context remains an explicit, reviewed one-request handoff.
- TypeScript and Expo lint passed (0 errors; 3 existing `require()` warnings). No build, live provider request, rendered walkthrough, or device check.

## AU-16 checkpoint

- The nine primary activity IDs all resolve through the independent experience registry. The `/do` URL remains stable while its route implementation now lives in `features/activities/ActivityRouteScreen.tsx`.
- Active catalog, run lifecycle, local handoff, art, and shared feature UI are under `features/activities/`. The legacy Task Reset record is the only host fallback; its view no longer mounts unrelated activity panels. Unused generic activity panels and the old saved-letter shelf were removed. Saved data repositories and route compatibility remain.
- Added activity-owned illustrated state transitions for Notice & Name and Reach Out. Updated the architecture map and nine-activity demo checklist to match current screens and collections.
- TypeScript passed. Expo lint has zero errors and three existing `require()` warnings. No build or rendered/device/performance review was run.
