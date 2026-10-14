# UI study plan

## Implementation plan

### Purpose

Compare three visual treatments for Mira's Talk screen using the approved V0.03 interaction: an open emotional moment can lead to listening, one optional activity, a focused Do screen, an outcome check, and return to Talk. The study should help choose a visual direction before production UI changes.

### Current app structure

- Talk is the default tab and contains voice/text conversation, Help, context, one activity offer, and recovery states.
- Do is a temporary route entered after the user accepts the offer.
- You is the second tab and contains Journal, approved context, saved preferences, and privacy controls.

### Work

1. Use the installed Expo and React Native packages to make an isolated React Native prototype, previewed with Expo Web.
2. Offer three Talk presence directions: no central presence, a subtle abstract presence, and a restrained illustrated companion.
3. Keep typography, palette, sample copy, flow, and controls consistent across the three directions so presence is the main variable.
4. Make the prototype navigable through Talk → one optional offer → Brain Dump → outcome check → Talk. Include a small You preview to represent the existing second tab.
5. Use inert UI state only. Do not connect microphone, backend, persistence, or analytics.
6. Review the existing UI against the design requirements and list gaps before production implementation.

### Product and design boundaries

- `PRD/mira_prd.md` controls product behavior. The design requirements guide presentation only.
- Keep exactly two permanent tabs, Talk and You. Do remains a temporary stack route.
- Preserve explicit push-to-talk: microphone off by default, hold to speak, release to send, no automatic VAD.
- Offer at most one approved activity at a time. Acceptance and decline remain clear and equally available.
- Do not add new interventions, clinical claims, clinician workflows, transcript retention, analytics, or a dashboard.
- Do not treat any concept, persona detail, palette, font, or device assumption as validated without user research.

### Acceptance checks

- The three directions can be compared in one prototype and each shows the same conversation-to-activity flow.
- The interaction labels communicate mic state, activity choice, and return path.
- The prototype uses React Native components and existing installed packages only.
- The production routes and behavior remain unchanged until a design direction is approved.
- Browser/device visual review and accessibility checks are recorded separately from successful bundling/typechecking.

## Review record

Design review and Autoplan findings will be appended here.
