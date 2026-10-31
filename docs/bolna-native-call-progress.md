# Call Mira implementation

## Step 1 — native conversation proof (device gate deferred)

Implemented:

- Firebase-authenticated `POST /workers/bolna/session`; Bolna credentials stay in `server/.env`.
- SIP.js 0.21.2 signaling with a custom session-description handler using installed native WebRTC 124.0.8. No browser audio element or WebView.
- Talk → Call Mira opens above the tabs and closes existing hold-to-talk first.
- Foreground call controls: start/retry, mute, hang-up, return. Cancellation aborts minting and releases microphone tracks immediately.
- Actual SIP 180 reports ringing; no artificial delay or ringback yet.
- The initial screen-owned foreground call has been replaced by the step 2 app-level controller below.

Gate outstanding:

The user explicitly deferred mobile testing and authorized proceeding to step 2 on 31 October 2026. These checks remain unverified; they no longer block implementation.

- The configured Bolna API key authenticates successfully, but `GET /v2/agent/all` returned an empty list on 31 October 2026. Configure Mira's agent and set `BOLNA_AGENT_ID` in `server/.env`.
- ADB is unavailable on PATH and at the usual local Android SDK path. Need the connected OnePlus and its SDK/ADB path.
- Record Android version; prove agent access, two-way audio, interruption, hang-up, and hold-to-talk returning normally on the OnePlus. No device/audio success is claimed.

Passed: server authentication, no-store session response, sanitized provider failure, cancellation during session mint, repeated hang-up, TypeScript and Android bundle export. Focused ESLint reported only two lazy-native-import warnings.

## Step 2 — app-level controller and Android integration

Implemented in source:

- A single app-level call store owns SIP, media and system resources. Screen navigation and backgrounding no longer end the call. Sign-out and root teardown do.
- CallKeep 4.6.1, self-managed mode, a microphone/phone-call foreground service, and Expo config-plugin wiring. A new Android native build is required; an OTA update or Expo Go cannot supply these modules.
- The foreground call notification provides Return and End call. Its deep link reopens `/call`; actions use the current call UUID.
- Minimized call bar, mute synchronization, available Android audio-route selection, route-change refresh, and elapsed duration that survives minimize/reconnect.
- Android Telecom focus loss ends the call and releases focus; the app reports the interruption. Hold events suspend microphone and received audio. Android owns headset fallback and reports route changes.
- A shared microphone lease covers Bolna, existing OpenAI hold-to-talk and Brain Dump capture. A call reserves it before Android setup; cancellation and hang-up release it.
- A disconnected media connection gets a ten-second recovery window. Failed media or SIP signaling ends the call with retry available; no automatic redial.
- Native setup cancellation, late outgoing-call creation, stale callback isolation, and teardown on failure.

Validation: TypeScript, focused ESLint, Android JS bundle export, Expo Android prebuild/config generation, and mocked call lifecycle/microphone/cancellation/hold-to-talk checks. Existing voice-test mocks were brought up to date with the current context/tool contracts. No native compilation, installation or physical-device behavior is claimed.

## Step 3 — caller UI and ringback

Implemented in source:

- Warm dark caller screen with the existing Mira character portrait, status, elapsed duration, mute/audio/minimize controls, and a prominent red cancel/hang-up button.
- Ended/failed states with duration where available, retry/call again, and return to Talk. Scrollable layouts and route picker support smaller screens and larger text.
- A matching minimized bar with portrait, mute status, call duration/status and hang-up.
- Gentle portrait motion and a halo driven by actual inbound WebRTC audio levels when available. Visual polling is confined to the visible, foreground call screen and stops with reduced motion; no fabricated speaking indicator.
- Native Android ringback uses ToneGenerator on the voice-call stream. Only a SIP 180 response starts it. Connect, cancel, failure, interruption, notification hang-up and native teardown stop/release it. The tone is scoped to the call UUID and checks native call focus before starting. No synthetic ringing delay and no new audio dependency.

Native module changes require rebuilding Android. Physical audio/routing and visual device checks remain deferred at the user's request.

## Step 4 — bounded context and Talk fallback

Implemented:

- A call-purpose adapter selects approved shared context using the existing local selector. It includes at most six recent Talk messages (800 characters each), one relevant shared excerpt (600 characters), three saved preferences (240 characters each), and the Firebase display name if set (80 characters). No name is inferred from email. No private Journal entry, draft or activity output is read by the adapter.
- The authenticated session route validates the bounds and rejects additional fields. It passes only `person_name` and a JSON `mira_context` snapshot in Bolna's `user_data`; no account identifiers or provider keys are embedded in that snapshot.
- Retries freshly select context and recheck consent revision before opening native media. Revocation closes an active call. Sign-out clears the in-process Talk snapshot and pending fallback.
- Retry call and Continue with Talk are available after failure. The fallback closes provider/native media first, releases the microphone, returns to the existing Talk route and selects text mode without replacing Talk messages or the draft. Call-only speech is not imported: transcripts remain deferred.
- Call mint/server failures identify calling as temporarily offline; text-worker failures show Mira as temporarily offline while local Journal and saved Actions stay available.

Agent configuration completed on 31 October 2026: created **Mira - English**, applied the [Mira agent prompt](bolna-mira-agent-prompt.md), and configured its ID in `server/.env`. English voice is Tripti - Calm and Clear via ElevenLabs Turbo v2.5, with Deepgram Nova-3 and GPT-4.1 mini. Provider readback and web-call session mint succeeded. Real audio remains unverified.

Focused checks cover bounds, account isolation, consent races/revocation, refreshed context, authenticated server forwarding, cancellation and resource cleanup before fallback. Device testing remains deferred.

## Remaining sequence

5. Focused OnePlus checks from the approved plan.

## Development build — 31 October 2026

- User confirmed the Bolna browser conversation works.
- Android EAS `development` build **85768d12-f8b8-4553-8989-cfc9b7f758d2** finished successfully, including native compilation and signing.
- [Install APK](https://expo.dev/artifacts/eas/qTIcgp0QCZeGD2ZiTAcDkd-VFFYm-bZHhzvIG22RLKc.apk) · [Build logs](https://expo.dev/accounts/feat.sandip/projects/mira-native-spike/builds/85768d12-f8b8-4553-8989-cfc9b7f758d2).
- Anchored the generated-project exclusions in `.easignore` to `/android/` and `/ios/` so `plugins/android/MiraCallPackage.java` is uploaded.
- Backend and Metro were started locally; tunnel health returned `ok`. Development URL at handoff: `https://akbjzkk-featsandip-8081.exp.direct` (temporary).
- Native installation, audio and lifecycle checks on the OnePlus remain unverified.

Protocol references: [Bolna SDK](https://github.com/bolna-ai/web-call), [native WebRTC usage](https://react-native-webrtc.github.io/handbook/guides/basic-usage.html).
