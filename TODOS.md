# Deferred work

## Product decisions

- Confirm Actions/Continue navigation and saved-content placement against the PRD before moving screens or data.
- Decide how Talk handles ambiguous acceptance replies; prefix recognition remains until then.
- Define clinician-reviewed activity content, escalation boundaries, and any Mpower handoff before a pilot.
- Consider session-only Journal context after Mpower feedback on consent and data lifetime.
- Revisit hands-free voice activity detection after demonstrating push-to-talk.
- Compare other voice/model providers after polishing the first provider's experience.
- Revisit accounts, deployment, scaling, admin tools, and operational data lifecycle only if Mpower pursues a pilot.

## Engineering

- Plan the context and adaptive-support upgrade in [v3.md](v3.md): temporary situations and expiry, approved memory, local retrieval, shared context across Talk/text/calls/Activities, and evaluation. (Large; future version.)
- Add server-enforced per-user daily token/usage limits for voice and calls to curb abuse; keep ordinary text chat unlimited. This is usage protection, not billing.
- Coordinate Talk Realtime and Bolna through one audio owner; preserve Talk text, restore it after calls, and define interruption, retry, text-during-call, and route behavior. (M, P1) Keep hold-to-talk; never let both providers own live audio.
- Add Bluetooth/wired headset routing and speaker selection for Realtime; reuse existing call permission handling where suitable and verify connect/disconnect and fallback on OnePlus. (M, P2) The call plugin already adds `BLUETOOTH_CONNECT`; rebuild if additional native changes are needed.
- Revisit user-initiated clipboard copy for Reach Out with a compatible native module and honest success/failure feedback. (S, P2) Reach Out currently saves drafts to Actions > Continue and never sends them; verify on Android with a compatible build.
- Assess server-side WebRTC sideband only if Mpower approves a pilot; compare session ownership, authorization, network needs, and failure handling. (S, P3)

## Design

- Give Talk's disconnected Connect button a Mira-specific companion visual (Mira character, not generic chat waves); show connecting state, then the mic when ready. (Discussed; not implemented.)
- Review colors, typography, and interactions against Mpower's approved brand and accessibility needs only if a pilot proceeds; retain Mira V0's warm neutral tokens meanwhile. (M, P3)

## Device verification

- On the OnePlus, record Android version and verify Firebase sign-in, Journal save/reopen, offline Activities, Talk hold/release and reconnect, and Brain Dump transcription permission/retry; Journal has no recording flow. (Pending; source checks do not confirm native behavior.)
