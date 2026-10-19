# Mira connected phone demo

Mira's current v0.03 demo includes Talk, Journal, and an Actions library with nine canonical activities: Grounding, Paced Breathing, Brain Dump, One Small Step, Notice & Name, Unsent Letter, Reach Out, Move / Change Your Scene, and One Song Break. Current surfaces offer only these nine; transitional catalog entries remain for compatible legacy records. Talk uses explicit hold-to-talk. Brain Dump's optional held speech is a transcription-only path whose physical Android behavior still requires verification.

## Run

No Android Studio, Android SDK, or adb is needed for the cloud-build path.

1. Put the OpenAI key in `server/.env` using `server/.env.example`. Never put it in a mobile environment variable.
2. Run the API from the project root:

   ```powershell
   uv venv server/.venv
   uv pip install --python server/.venv/Scripts/python.exe -r server/requirements.txt
   server/.venv/Scripts/python.exe -m uvicorn server.app:app --host 0.0.0.0 --port 8000 --no-access-log
   ```

3. The FastAPI service stores the single synthetic demo user's saved text, approved context, action runs, feedback, and only explicitly approved helpful lessons in `server/mira.db` (ignored by Git). Task dumps and default Talk transcripts are not stored. Reset the demo from Journal when needed. Metro proxies Mira API routes to local FastAPI, so the phone does not need direct access to port 8000.
4. Build the installable APK:

   ```powershell
   cd mobile
   npm ci
   npx eas-cli login
   npx eas-cli build:configure --platform android
   npx eas-cli build --platform android --profile development
   ```

   EAS creates/links the project and manages the Android signing key. Install the APK from the EAS build URL/QR on the OnePlus.

5. Start Metro using a tunnel when Windows or the Wi-Fi blocks local connections:

   ```powershell
   npx expo start --dev-client --tunnel
   ```

   Open the returned development-client link on the phone with Mira installed. Keep FastAPI, Metro, and the Expo tunnel running. `expo-constants` reads the current server host; app API traffic uses the same origin and Metro forwards session routes and `/health` to local FastAPI. Keep synthetic data only; the tunnel URL is public while running.

The development APK needs Metro while testing. Expo Go is secondary; full voice requires this APK. Saved Journal entries stay private until a selected excerpt is separately approved. Helpful action lessons are shown before saving and stay off unless the person opts in. Journal supports revoking/deleting both kinds of context. Voice audio is sent to OpenAI for transcription and deleted from the phone cache after success or explicit discard; failed uploads remain available for retry. Talk history and active moment state stay in app memory only, for voice retry or text continuation.

## Nine-activity physical gate

Use [`docs/nine_activity_demo_checklist.md`](docs/nine_activity_demo_checklist.md) for the activity matrix, cross-flow checks, exact automated evidence, and outstanding device validation. Use synthetic inputs only. No physical Android device was connected during the current final integration pass; do not treat mock tests or an Android bundle export as device acceptance. Work Order 11 Brain Dump capture remains pending OnePlus verification.

## Focused local checks

```powershell
server/.venv/Scripts/python.exe -m unittest server.test_contract
cd mobile
npx tsc --noEmit
node tests/voice-gate.cjs
npx expo export --platform android
```

Capabilities are random, session-bound, expiring, and required for relays, transcription, and text. Tool calls are registered from the phone's provider event, bound to the current voice generation, validated, expire after 30 seconds, and cannot execute twice. This verifies the relay contract, not independent provider-event authenticity: the authorized demo phone remains trusted. Server-side sideband ownership is deferred as specified in `TODOS.md`. Use only the isolated private synthetic-data demo.

Implementation references: [OpenAI WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc?api=realtime), [OpenAI push-to-talk](https://developers.openai.com/api/docs/guides/realtime-conversations#push-to-talk), [React Native WebRTC](https://react-native-webrtc.github.io/handbook/guides/basic-usage.html), [Expo SDK 57 audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/), and [EAS development builds](https://docs.expo.dev/develop/development-builds/create-a-build/).

The optional live provider-contract probe is `server/.venv/Scripts/python.exe -m server.probe_provider`. It uses synthetic text and the real Realtime tool events; it is not a substitute for native audio or the physical gate.
