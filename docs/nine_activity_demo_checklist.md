# Mira nine-activity demo checklist

**Build:** catalog `0.14`; mobile client `activity-ui-11`.  
**Purpose:** record the current activity architecture and guide the remaining physical Android walkthrough. See the [ordered AU implementation ledger](../PRD/mira_activity_upgrade_status.md). Use synthetic inputs only.

## Canonical Actions library

The current Actions and Talk activity surfaces expose these nine IDs. Transitional catalog records remain available only where legacy compatibility requires them.

| Group | ID | Activity | Local renderer / key integration |
|---|---|---|---|
| Follow a guide | `grounding` | Grounding | `experiences/grounding/GroundingScreen.tsx` |
| Follow a guide | `paced_breathing` | Paced Breathing | `experiences/paced-breathing/PacedBreathingScreen.tsx` |
| Express | `brain_dump` | Brain Dump | `experiences/brain-dump/BrainDumpScreen.tsx` (typing plus optional transcription-only push-to-talk) |
| Move forward | `one_small_step` | One Small Step | `experiences/one-small-step/OneSmallStepScreen.tsx` |
| Express | `name_a_feeling` | Notice & Name | `experiences/notice-name/NoticeNameScreen.tsx` |
| Express | `unsent_letter` | Unsent Letter | `experiences/unsent-letter/UnsentLetterScreen.tsx` |
| Move forward | `reach_out` | Reach Out | `experiences/reach-out/ReachOutScreen.tsx` |
| Take a break | `short_movement` | Move / Change Your Scene | `experiences/move-scene/MoveSceneScreen.tsx` |
| Take a break | `one_song_break` | One Song Break | `experiences/one-song/OneSongScreen.tsx` |

The `activities/runtime/ActivityHost.tsx` mounts one screen for the selected primary ID. Only the historical `task_reset_60s` ID reaches `activities/legacy/LegacyActivityAdapter.tsx`; it does not mount the nine primary screens or their controllers.

## Automated evidence from Work Order 12

- The app bundles all nine canonical activity definitions; local screens and run lifecycles do not fetch activity cards or create server runs.
- The server's support selector receives only the nine canonical activities for the current client and returns a validated selection.
- Old private-data endpoints return an update-required response; the app no longer uses them. The legacy test database was deleted without import.
- Current server checks cover bounded text/voice/Journaling workers, the support selector/relay, and rejection of retired private endpoints. Local device-storage and activity checks cover offline behavior.
- Mobile typecheck and the focused Android backup/storage, Journal, and activity checks passed. Physical Android flow and voice capture remain unverified; see the offline-first ledger.

## AU-17 integration walkthrough ? handset run pending

- EAS Android development-client APK succeeded: [install / build details](https://expo.dev/accounts/feat.sandip/projects/mira-native-spike/builds/98c74385-7815-4b1c-bcb8-cefa200903a7). Install this development build, then run Metro with the development-client profile.
- Source review confirms the main path is wired: accept the exact pending Talk proposal ? open its local activity ? save/open its local output ? explicitly opt into reuse ? retrieve that preference for a related Talk/text suggestion. Private activity writing and letters remain excluded from general context.
- Short demo path to run on the OnePlus: use synthetic Talk input; accept an offered Brain Dump; request an optional takeaway; select it for One Small Step; save and open the action detail; complete One Small Step and explicitly choose ?Use again?; return to Talk and ask a related question. Confirm the app offers a relevant activity, then enable airplane mode and confirm Actions plus saved details still open.
- This is a review script, not a claim of live AI or handset verification. No ADB/physical device is available in this pass; complete and record the physical checklist below before presenting runtime results.

## Physical walkthrough - pending

On an installable development build, record Android version and complete each item. No item below is claimed as physically verified in this pass.

- [ ] Actions shows exactly nine cards under Express, Move forward, Take a break, and Follow a guide; no blank, disabled, or duplicate legacy card.
- [ ] Launch each of the nine cards from Activities, use its own start/editor/collection flow, and return. Confirm only the selected screen is visible and there is no generic intro or first-frame flash.
- [ ] Enter synthetic content; verify no raw draft appears in route URLs, automatic storage, or logs. Check clear/discard and failed-save states retain or remove content according to each activity contract.
- [ ] Exercise Talk offer -> accept -> activity -> Talk return, and Talk offer -> decline. Confirm one-time excerpts land in the editable Talk composer once and are not sent automatically; simulate transfer failure and confirm source draft remains.
- [ ] Save a One Small Step to Continue, relaunch/resume it, complete or remove it. Open the Letter and Reach Out collections from their own activities; open other saved outputs from Activities.
- [ ] Try optional feedback with no/not now, explicit preference review/save, then revoke and delete it in You. Confirm failed local writes are not reported as saved.
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
- The activities have individual art and state transitions; the additions in AU-16 (Notice & Name bloom and Reach Out letter scene) still need rendered-device visual review.
- Passing server contracts and Android JavaScript export establish API/bundle compatibility only. They do not prove native capture, provider connectivity, or successful OS app-link resolution.
