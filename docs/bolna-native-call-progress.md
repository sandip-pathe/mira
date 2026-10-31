# Call Mira implementation

## Step 1 — native conversation proof (in progress)

Implemented:

- Firebase-authenticated `POST /workers/bolna/session`; Bolna credentials stay in `server/.env`.
- SIP.js 0.21.2 signaling with a custom session-description handler using installed native WebRTC 124.0.8. No browser audio element or WebView.
- Talk → Call Mira opens above the tabs and closes existing hold-to-talk first.
- Foreground call controls: start/retry, mute, hang-up, return. Cancellation aborts minting and releases microphone tracks immediately.
- Actual SIP 180 reports ringing; no artificial delay or ringback yet.
- Leaving the screen or backgrounding ends this first-step call. Background support belongs to step 2.

Gate outstanding:

- The configured Bolna API key authenticates successfully, but `GET /v2/agent/all` returned an empty list on 31 October 2026. Configure Mira's agent and set `BOLNA_AGENT_ID` in `server/.env`.
- ADB is unavailable on PATH and at the usual local Android SDK path. Need the connected OnePlus and its SDK/ADB path.
- Record Android version; prove agent access, two-way audio, interruption, hang-up, and hold-to-talk returning normally on the OnePlus. No device/audio success is claimed.

Passed: server authentication, no-store session response, sanitized provider failure, cancellation during session mint, repeated hang-up, TypeScript and Android bundle export. Focused ESLint reported only two lazy-native-import warnings.

## Remaining sequence

2. App-level controller, CallKeep, audio routing, background/lock lifecycle and cleanup.
3. Complete caller design, portrait, timer and call-progress sounds.
4. Approved bounded context and fallback.
5. Focused OnePlus checks from the approved plan.

Protocol references: [Bolna SDK](https://github.com/bolna-ai/web-call), [native WebRTC usage](https://react-native-webrtc.github.io/handbook/guides/basic-usage.html).
