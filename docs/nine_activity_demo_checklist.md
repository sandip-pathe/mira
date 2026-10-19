# Mira nine-activity demo checklist

**Build:** catalog `0.14`; mobile client `activity-ui-11`.  
**Purpose:** record integration evidence and guide the remaining physical Android walkthrough. Use synthetic inputs only.

## Canonical Actions library

The current Actions and Talk activity surfaces expose these nine IDs. Transitional catalog records remain available only where legacy compatibility requires them.

| Group | ID | Activity | Local renderer / key integration |
|---|---|---|---|
| Follow a guide | `grounding` | Grounding | `GroundingActivityPanel` |
| Follow a guide | `paced_breathing` | Paced Breathing | `PacedBreathingPanel` |
| Express | `brain_dump` | Brain Dump | `BrainDumpPanel` (typing plus optional transcription-only push-to-talk) |
| Move forward | `one_small_step` | One Small Step | `OneSmallStepPanel` |
| Express | `name_a_feeling` | Notice & Name | `NoticeNamePanel` |
| Express | `unsent_letter` | Unsent Letter | `LetterActivityPanel` |
| Move forward | `reach_out` | Reach Out | `ReachOutPanel` |
| Take a break | `short_movement` | Move / Change Your Scene | `MoveScenePanel` |
| Take a break | `one_song_break` | One Song Break | `OneSongPanel` |

## Automated evidence from Work Order 12

- `GET /sessions/{id}/actions` and `GET /sessions/{id}/interventions` return the nine canonical IDs in the intended registry order.
- The Talk selector receives only the nine canonical activities for a current client.
- All nine canonical activities return current `0.14` content and accept an explicitly consented start with current capabilities.
- Legacy task-reset and letter content remains readable; current capability gating permits the saved `task_reset_60s` continuation while excluding retired library entries from current offers.
- The existing server contract suite passed (38 tests), including preference consent/retry/revoke/delete/reset, exact capability gating, and transcription-only secret contracts.
- Mobile typecheck passed. Expo lint passed with 0 errors and 9 warnings. Talk and Brain Dump mocked capture scripts passed. Android export result is recorded in `PRD/mira_activity_build_status.md`.

## Physical walkthrough - pending

On an installable development build, record Android version and complete each item. No item below is claimed as physically verified in this pass.

- [ ] Actions shows exactly nine cards under Express, Move forward, Take a break, and Follow a guide; no blank, disabled, or duplicate legacy card.
- [ ] Launch each of the nine cards from Actions, start it, and return to Actions. Confirm the matching panel appears and there is no repeated intro when resuming Continue.
- [ ] Enter synthetic content; verify no raw draft appears in route URLs, automatic storage, or logs. Check clear/discard and failed-save states retain or remove content according to each activity contract.
- [ ] Exercise Talk offer -> accept -> activity -> Talk return, and Talk offer -> decline. Confirm one-time excerpts land in the editable Talk composer once and are not sent automatically; simulate transfer failure and confirm source draft remains.
- [ ] Save a One Small Step, Reach Out, or Move item to Continue; relaunch/resume it; complete or remove it. Confirm other activities do not create new Continue items.
- [ ] Try optional feedback with no/not now, explicit preference review/save, then revoke and delete it in You. Confirm failed saves are not reported as saved and reset clears demo data.
- [ ] Check large font, TalkBack focus/order/labels, reduced motion, keyboard/back, offline/weak connection, app switching/background, interruptions, and audio ownership.
- [ ] For Brain Dump voice specifically: deny permission, allow permission, hold and release, release before mic startup, disconnect, induce transcription failure, type while processing, and background/interruption. Confirm no automatic mic restart, stale transcript insertion, assistant speech, or loss of typed content.
- [ ] Confirm Help and urgent-help behavior remain the existing scripted placeholder, with no implied live Mpower support connection.

## Build and run

Use the repository's existing cloud development-build flow (PowerShell examples):

1. Put the OpenAI key in `server/.env` from `server/.env.example`; never expose it in mobile environment variables.
2. From the repository root, install and run FastAPI:

   ```powershell
   uv venv server/.venv
   uv pip install --python server/.venv/Scripts/python.exe -r server/requirements.txt
   server/.venv/Scripts/python.exe -m uvicorn server.app:app --host 0.0.0.0 --port 8000 --no-access-log
   ```

3. Build/install the Android development client through EAS, from `mobile`:

   ```powershell
   npm ci
   npx eas-cli login
   npx eas-cli build:configure --platform android
   npx eas-cli build --platform android --profile development
   ```

4. From `mobile`, run Metro with the project tunnel and open its link in the installed development client:

   ```powershell
   npx expo start --dev-client --tunnel
   ```

Keep FastAPI, Metro, and the tunnel running. Use only synthetic demo data. The tunnel URL is public while running. `npx expo start --android` is the existing local convenience command when a configured Android environment is available.

## Current limits

- No rendered-device walkthrough, Android font/accessibility/keyboard check, app-switch/interruption check, or physical voice capture was completed here; ADB/device access was unavailable.
- Brain Dump push-to-talk is implemented and mock-tested, but it must remain labeled unverified until the OnePlus gate is passed.
- The Unsent Letter bespoke envelope illustration remains outstanding; the current UI uses native layout and an installed icon. Rendered visual quality is not confirmed.
- Passing server contracts and Android JavaScript export establish API/bundle compatibility only. They do not prove native capture, provider connectivity, or successful OS app-link resolution.
