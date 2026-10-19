# Deferred work

## Held product decisions from the code review

- Resolve Actions/Continue navigation and saved-content placement against the PRD before moving screens or migrating data.
- Define voice acceptance for ambiguous replies. Existing prefix recognition remains in place until that decision.

## Focused verification pending

- Check the refactored Journal recording controller on the OnePlus: record/stop, leave during preparation/capture, background/foreground, transcription retry/discard, and Talk voice after Journal. Record Android version. Controller checks, typecheck, and server checks do not establish native audio behavior.

These items are deliberately outside Mira V0's connected phone demo. Revisit them with Mpower after the demo:

- Consider session-only journal context, separate from persistent approved memory, after Mpower feedback on consent and data lifetime.
- Explore hands-free automatic or semantic voice activity detection after push-to-talk is demonstrated.
- Compare additional model/voice providers after the first provider's experience is polished.
- Define clinician-reviewed action content, escalation boundaries, and any Mpower handoff with Mpower experts before a pilot.
- Revisit accounts, deployment, scaling, admin tools, and operational data lifecycle only if Mpower elects to pursue a pilot.

## Engineering

### Revisit clipboard export for Reach Out

**What:** Consider a user-initiated copy action for the Reach Out message preview, with a compatible native clipboard module and truthful success/failure feedback.

**Why:** Clipboard export is temporarily removed so the current development app no longer depends on the unavailable `ExpoClipboard` native module.

**Context:** Reach Out currently lets the person review, edit, and explicitly save the draft to Actions > Continue. Mira does not send the message. Reintroduce clipboard export only when a native build containing the selected clipboard module is available and the flow can be checked on Android.

**Effort:** S
**Priority:** P2
**Depends on:** A compatible native development build and Android verification.

### Evaluate server-side WebRTC sideband for a pilot

**What:** If Mpower approves a pilot, assess replacing phone-relayed tool calls with a server-side WebRTC sideband.

**Why:** A pilot may need the backend to own provider events, authorization, and tool execution rather than trust a phone relay.

**Context:** Mira V0 uses phone relay to keep the connected demo simple and adds an expiring demo-session capability. Revisit only after Mpower decides to explore a pilot; compare session ownership, auth/network requirements, and failure handling before changing the transport.

**Effort:** S
**Priority:** P3
**Depends on:** Mpower pilot decision and defined auth/network requirements.

## Design

### Revisit the visual system if Mpower approves a pilot

**What:** Run a focused design consultation to review Mira V0's neutral colors, typography, and interaction patterns against Mpower's approved brand and design requirements.

**Why:** V0 uses an intentionally neutral visual direction because Mpower branding is not approved for the demo.

**Pros:** Aligns a future pilot with Mpower's identity and any established accessibility standards.

**Cons:** Adds design work and depends on brand guidance; unnecessary if the demo does not progress.

**Context:** Keep the small warm, grounded token set for V0. Run `/design-consultation` only after Mpower feedback and a pilot decision.

**Effort:** M
**Priority:** P3
**Depends on:** Mpower feedback, approved brand assets, and a pilot decision.
