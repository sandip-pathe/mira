# Mira connected phone demo

Mira's current v0.03 demo includes Talk, Journal, and an Actions library with nine canonical activities: Grounding, Paced Breathing, Brain Dump, One Small Step, Notice & Name, Unsent Letter, Reach Out, Move / Change Your Scene, and One Song Break. Current surfaces offer only these nine; transitional catalog entries remain for compatible legacy records. Talk uses explicit hold-to-talk. Brain Dump's optional held speech is a transcription-only path whose physical Android behavior still requires verification.

**Demo development direction:** We do not want to hold back on technology or capabilities. Build a compelling demonstration of what Mira can do, and track production hardening separately. The next activity experience is proposed in the [activity upgrade plan](PRD/mira_activity_upgrade_plan.md), including a review of the supplied proposal and ordered implementation steps.

## Run

No Android Studio, Android SDK, or adb is needed for the cloud-build path.

1. Put the OpenAI key in `server/.env` using `server/.env.example`. Never put it in a mobile environment variable.
2. Run the API from the project root:

   ```powershell
   uv venv server/.venv
   uv pip install --python server/.venv/Scripts/python.exe -r server/requirements.txt
   server/.venv/Scripts/python.exe -m uvicorn server.app:app --host 0.0.0.0 --port 8000 --no-access-log
   ```

3. Mira uses Firebase Email/Password sign-in for existing accounts. The Firebase web-app configuration is in `mobile/src/shared/firebase.ts`; no Firebase environment variables or service-account key are needed. Email/Password must be enabled in Firebase Authentication. The app does not create accounts.
4. Private Journal, memory, feedback, activity-catalog, and activity-run APIs are retired. The legacy test database was deleted without import. New Journal text entries, drafts, excerpts, Continue items, and explicit preferences are stored on-device. Previously saved voice-note references remain stored on-device. Task dumps and default Talk transcripts are not stored. Metro proxies worker requests to local FastAPI, so the phone does not need direct access to port 8000.
5. Build the installable APK:

   ```powershell
   cd mobile
   npm ci
   npx eas-cli login
   npx eas-cli build:configure --platform android
   npx eas-cli build --platform android --profile development
   ```

   EAS creates/links the project and manages the Android signing key. This development profile allows private-LAN HTTP and needs Metro. Install the APK from the EAS build URL/QR on the OnePlus.

   For a standalone `offline-gate` APK, first put the hosted HTTPS API origin in `expo.extra.apiUrl` in `mobile/app.json`, then build with `--profile offline-gate`. That profile refuses to build without an HTTPS URL and excludes the development-only cleartext HTTP plugin. The standalone APK does not use Metro.

6. Start Metro using a tunnel when Windows or the Wi-Fi blocks local connections:

   ```powershell
   npx expo start --dev-client --tunnel
   ```

   Open the returned development-client link on the phone with Mira installed. Keep FastAPI, Metro, and the Expo tunnel running. `expo-constants` reads the current server host; app worker traffic uses the same origin and Metro forwards `/workers/*` and `/health` to local FastAPI. Keep synthetic data only; the tunnel URL is public while running.

The development APK needs Metro while testing. Expo Go is secondary; full Talk voice requires this APK. Saved Journal entries stay private until a selected excerpt is separately approved. Helpful action lessons are shown before saving and stay off unless the person opts in. Journal supports revoking/deleting both kinds of context. Brain Dump transcription is an explicit online operation, and Talk audio goes directly to OpenAI over WebRTC. Talk history and active moment state stay in app memory only, for voice retry or text continuation.

## Nine-activity physical gate

The public catalog source is [`mobile/assets/catalog/activities.json`](mobile/assets/catalog/activities.json). The app bundles this JSON and the Python selector reads the same definitions. Keep this asset in server deployment packages for support selection. Activities, lifecycle, Continue, preferences, Journal, and Talk context use device data. Optional AI task sorting and Brain Dump transcription still require a connection. See the [offline-first plan and ledger](PRD/mira_offline_first_plan.md) for implementation and verification limits.

Check catalog compatibility without running the API or OpenAI: from `mobile`, run `node tests/activity-catalog.cjs`. This checks all definitions and aliases against both the TypeScript and Python adapters.

Run `node tests/activity-run.cjs` for focused local activity/Continue/preference checks with the network disabled and the native filesystem mocked. These checks do not replace physical Android flow verification.

OF-03 adds `expo-sqlite` 57.0.4. Continue items, existing saved-letter archives, and explicit activity preferences use `mira-private.db` on the device. On first access, each old JSON collection is validated and imported transactionally; only a verified committed import permits removal of its old file. Failed imports retain the source, and migration markers prevent stale files from restoring deleted records.

Journal browsing, writing, saving, reopening, and deletion work locally. Starter prompts stay optional; Enter separates text entries and Backspace removes the boundary. One fixed Save action finalizes the session and returns. Journal has no voice recording, playback, AI follow-up, or transcription worker. Text and voice Talk select approved context and opted-in preferences on-device; only bounded relevant results and explicit support requests go to workers. Talk tab focus and local activity choices do not call the server. OF-07 retired the old private-data APIs and deleted the legacy test database without import. Focused checks are listed in the offline-first plan.

Android backup/transfer exclusions are generated by `plugins/withDeviceOnlyData.js`; iOS backup exclusions are not yet implemented. Older APKs cannot use the new SQLite module and show an update message. The final standalone Android build and device gate are recorded in the plan ledger. `node tests/device-storage.cjs` (Node 24+) covers SQLite import/rollback/restart; `node tests/device-backup.cjs` checks backup resources and the composed Expo manifest.

Use [`docs/nine_activity_demo_checklist.md`](docs/nine_activity_demo_checklist.md) for the activity matrix, cross-flow checks, exact automated evidence, and outstanding device validation. Use synthetic inputs only. No physical Android device was connected during the current final integration pass; do not treat mock tests or an Android bundle export as device acceptance. Work Order 11 Brain Dump capture remains pending OnePlus verification.

## Focused local checks

```powershell
   server/.venv/Scripts/python.exe -m unittest server.test_contract server.test_offline_cutover
cd mobile
npx tsc --noEmit
node tests/voice-gate.cjs
npx expo export --platform android
```

The phone sends Firebase ID tokens to `/workers/*`; FastAPI verifies them against the configured Firebase project. Each account is capped at 120 worker requests/minute and 10,000/day; all accounts share a 1,000/minute process cap. These generous rolling limits and temporary voice-relay state are in memory, so deploy exactly one server process/replica. They reset on restart and are not a public-service billing boundary. Tool calls are bound to the current voice generation, validated, expire after 30 seconds, and cannot execute twice. This verifies the relay contract, not independent provider-event authenticity: the signed-in demo phone remains trusted. Server-side sideband ownership is deferred as specified in `TODOS.md`. Use only the isolated private synthetic-data demo.

Implementation references: [OpenAI WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc?api=realtime), [OpenAI push-to-talk](https://developers.openai.com/api/docs/guides/realtime-conversations#push-to-talk), [React Native WebRTC](https://react-native-webrtc.github.io/handbook/guides/basic-usage.html), [Expo SDK 57 audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/), and [EAS development builds](https://docs.expo.dev/develop/development-builds/create-a-build/).

The optional live provider-contract probe is `server/.venv/Scripts/python.exe -m server.probe_provider`. It uses synthetic text and the real Realtime tool events; it is not a substitute for native audio or the physical gate.
