# Mira — Design Requirements Document

**Version:** 1.0  
**Date:** 14 October 2026  
**Applies to:** V0.03 mobile design and prototype handoff  
**Status:** Final compiled requirements baseline; visual identity and usability remain unvalidated  
**Platform:** React Native + Expo, Android first; existing FastAPI backend

Mira's main experience is a private audio-call-style session: talk, receive an optional suggestion, try one focused activity, and return to the conversation. Journal provides a separate place for intentional reflection and user-controlled saved context.

> **Scope update (2026-10-19):** This October 14 baseline is superseded on activity catalog, Actions navigation, and Continue behavior by the selected [Nine Activities Master Blueprint](PRD/Mira_Nine_Activities_Master_Blueprint_v2.1.md), revision 2.2. The blueprint's nine-slot catalog and permanent Activities library are the target. This document continues to guide visual judgment and preserves the Talk, Journal, voice, privacy, Help, consent, and safety contracts; it does not reopen the superseded catalog or navigation decisions.

> **Demo capability direction (2026-10-20):** We do not want to hold back on technology or capabilities. Distinctive activity visuals, useful AI assistance, expressive motion, sound, and touch are encouraged when they make Mira more capable and compelling. "Calm" does not mean empty, generic, or mechanically restrained. Production hardening belongs in its own later workstream rather than driving every demo design decision. See the separate [activity upgrade plan](PRD/mira_activity_upgrade_plan.md).

## 1. Authority and decision status

This document consolidates the supplied `CURRENT_UX.md`, `mira_prd.md`, the proposed design research plan, and the design decisions in our conversation. It specifies the design target without claiming that the target already exists or has passed user testing.

| Status | Meaning |
|---|---|
| **Fixed product requirement** | Preserve V0.03 selection, consent, privacy, safety, and navigation rules from the PRD. |
| **Selected design direction** | Audio-call interaction model, simple call controls, temporary decisions, focused Do experiences, and a quiet Journal/You surface. Prototype and verify their presentation. |
| **Open hypothesis** | Presence style, exact palette, fonts, dark/light treatment, additional call controls, and research thresholds. |
| **Current implementation** | The routes, components, and states inventoried in CURRENT_UX. An inventory is evidence of described behavior, not a visual quality check. |

The PRD controls product behavior. This DRD controls the design brief. Prototype findings can justify a later change proposal; they do not automatically change the PRD. Where the call metaphor suggests a feature the PRD does not support, preserve the PRD behavior and test the idea separately.

**Evidence boundary:** The supplied review was text-only. No completed participant research, visual mockups, or on-device accessibility/performance checks are available.

## 2. Design purpose and principles

The design must make the core loop understandable: start talking or typing, understand a suggestion, freely accept or decline, use the activity, and return to Talk.

| ID | Requirement |
|---|---|
| D01 | Use a session/call model as the primary interaction. A message feed or prominent prompt composer must not define the default voice screen. |
| D02 | Keep one decision in focus. Mira offers at most one activity at a time. |
| D03 | Make voice primary and text readily available throughout the conversation. |
| D04 | Preserve explicit permission before activities and separate consent before saving future-use data. |
| D05 | Keep Stop, Skip, decline, and return paths clear. Listening is a complete, valid outcome. |
| D06 | Give each activity a focused presentation within one coherent design system. |
| D07 | Make privacy understandable through recording states, approval labels, and working controls. |
| D08 | Keep You quiet and personal. Exclude a wellness dashboard, streaks, achievement counts, feeds, and an activity browser. |
| D09 | Use plain language and restrained visual treatment. Avoid clinical jargon, exaggerated claims, and decorative complexity. |
| D10 | Make accessibility, one-handed operation, and Android constraints part of the layout from the start. |

## 3. Provisional usage profile

Use a **recruitment and usage hypothesis**, rather than an invented persona. Do not assume feelings, motivations, diagnoses, emotional literacy, or willingness to do exercises.

| Proposed attribute | Design implication | Status |
|---|---|---|
| Adults approximately 18–30 in urban Tier-1/Tier-2 India | Recruit an initial cohort; age/location do not determine visual taste. | Hypothesis |
| Android-first, smartphone-familiar | Use familiar native navigation, keyboard, call, and recording conventions. | Hypothesis; Android is the chosen build platform |
| English/Hinglish comfortable | Test short labels, mixed-language input, font coverage, and readable wrapping. | Hypothesis |
| Familiar with voice notes and calls | Test whether the call layout and hold-to-talk instructions are understood. | Hypothesis |
| Sometimes in shared living spaces | Test discreet text use and whether audio/recording states are clear. | Hypothesis |
| One-handed use on mid-range phones | Put frequent controls within comfortable reach; support both hands and varied screen sizes. | Hypothesis |
| Variable mobile data and background noise | Provide visible connection states, retry, and text recovery. | Hypothesis |
| Brief mobile sessions, initially exploring a 3–5 minute loop | Keep entry and instructions lightweight; do not impose a session countdown. | Hypothesis |

Exact device prices, daily app habits, participant quotas, and 3–4 second comprehension targets remain unvalidated. A behavioral persona may be developed after observing participants. The primary OnePlus demo device is a QA starting point, not a definition of the market.

## 4. Information architecture

| Destination | Entry and role | Design requirement |
|---|---|---|
| **Talk** | Default home; bottom tab | Call-style conversation, voice/text controls, optional captions/context, one activity offer, persistent Help. |
| **Do** | Temporary full-screen stack route from an accepted offer | Only the active activity; returns to Talk when skipped, stopped, or finished. |
| **You** | Bottom tab | Journal, approved context, consented preferences/history, privacy controls, demo reset. |
| **Help / urgent help** | States inside Talk | Accurate support placeholder and existing scripted emergency-demo state. |

The permanent destinations are Talk, Activities, and You; Do is a focused route, not a permanent tab. Journal stays inside You. Activities is the static nine-item library with an explicitly saved, device-local Continue shelf as specified by the selected blueprint.

Opening the app must not start microphone capture. Entering Do must not create an unrelated conversation or discard session context.

## 5. Talk: selected call-style direction

### Canvas and hierarchy

- **Top:** Mira's name, a short factual session status, and a persistent Help control.
- **Middle:** Spacious session canvas. Central presence is optional; compare no/minimal presence, subtle abstract presence, and restrained 3D/character presence.
- **Bottom:** Three primary controls: **microphone, end, type**. Keep their position stable and labels understandable.
- **Temporary content:** Short captions, an approved-context indicator, and the current decision surface. Avoid stacking permanent summary cards across the main canvas.

Use functional states such as “Ready,” “Listening,” “Thinking,” “Speaking,” and “Offline.” Relational copy such as “with you” may be explored, but it must not obscure whether the microphone is recording or the connection has failed.

The session must remain clearly identified as Mira's AI/demo experience. Call styling must not imply a human clinician, a telephone connection, or monitoring.

### Voice semantics

The audio-call appearance **does not change capture behavior**:

- Mic off by default; hold to speak, release to send.
- During capture, clearly show that recording is active.
- Pressing to interrupt Mira cancels/clears its current output through the existing voice path.
- Preserve the existing OpenAI Realtime/React Native WebRTC implementation and `turn_detection: null`.
- Do not label the current push-to-talk control “Mute” if that label implies a continuously open microphone.
- End stops the active voice session; it must not imply that anything was saved.

A mute toggle, mic lock, automatic turn detection, hands-free conversation, and background recording are separate prototype hypotheses. They are not V0.03 shipping requirements.

### Captions and text

Voice is the main experience; captions are optional and secondary. Explore showing the current or recent line without a persistent scrolling transcript dominating the screen. Reading must remain possible without depending on a short automatic dismissal timer.

Type opens a usable composer without leaving the conversation. Text mode must show enough readable context and responses to work independently of audio. Preserve visible in-session content on disconnection; do not persist raw Talk transcripts.

A combined “switch to text and silence output” interaction is worth testing for privacy. It must be labeled and verified before adoption; opening the keyboard alone must not be presented as proof that audio is muted.

## 6. Mid-session decisions

**Selected presentation:** Mira asks conversationally and a compact temporary decision card or bottom sheet appears within the call surface. It closes after the choice; Talk continues.

For an activity offer, show:

1. One canonical activity title and a short reason.
2. Duration/effort only when supplied by the catalog.
3. One primary acceptance action.
4. An equally clear decline/keep-talking action.

Example layout copy: **“Try a short grounding exercise?” → “Try it” / “Keep talking.”** This is an interface example, not new intervention wording or clinical content.

A clarifying question may have two or three compact answers when preference matters. This must not become a multi-activity chooser. Do not display a grid of tools or make the user rank interventions.

Tap is always available. Voice/tap parity is a prototype goal using explicit hold-to-talk and the same decision semantics; it does not authorize ambient listening. Either route must resolve the choice once.

Declining returns to conversation without pressure or a repeat offer for the same refusal. Dismissing the surface is never acceptance.

Use the same typography and surface language as Talk. Avoid fixed 40%/85% sheet heights: content, font scaling, keyboard, safe areas, and Android back behavior must determine usable sizing.

## 7. Do: focused activity experiences

Do is a temporary full-screen route. It should feel like a focused continuation of the session, with Mira guiding where the existing implementation supports it. “The call continues” means continuity of context and experience; it does not require an always-open mic or background audio.

Shared frame:

- Activity title, purpose, and a clear current step/state.
- Start, Skip, and Return before beginning.
- Pause/resume where applicable; Stop and Done during the activity.
- A clear return to Talk and brief optional outcome questions.
- Previously loaded activity content remains usable if the service becomes unavailable.

Use catalog-defined content and steps. The UI must not invent exercises, change eligibility, or substitute generated instructions.

### Historical catalog (superseded by the Nine Activities Master Blueprint)

| Catalog ID | Activity | Presentation pattern |
|---|---|---|
| `task_reset_60s` | Brain dump, sort, choose one small task | Capture and choose |
| `pause_60s` | Short pause | Choose and try |
| `name_a_feeling` | Put a name to what is happening | Step by step / short reflection |
| `grounding` | Short grounding exercise | Step by step |
| `brain_dump` | Get thoughts out; optionally sort | Capture and choose |
| `tiny_next_step` | Choose one small next action | Choose and try |
| `short_movement` | Brief walk or movement break | Choose and try; optional timer |
| `sleep_wind_down` | Short wind-down routine | Step by step |
| `reach_out` | Prepare what to say to someone | Prepare and act; user makes contact |

Listening, clarification, and human support are decision routes, not additional catalog activities.

### Three representative design test cases

- **Grounding:** Test clear step pacing, optional progress, pause, stop, and return. Approximately 60–90 seconds is a research example; canonical catalog duration controls the build.
- **Brain Dump:** Test free speaking/typing, editable content, and optional organization. Preserve every original line when sorting; the user chooses the final interpretation.
- **Tiny Next Step / Task Reset:** Test choosing one concrete action, moving into real-world action, optional user-controlled timing, and returning.

These test cases cover different interaction problems; they do not reduce the catalog to three activities.

**Brain Dump and Journal have different jobs.** Brain Dump is temporary unloading during a session. Journal is deliberate saved reflection. Do not automatically save a dump or copy it into memory. A future “save part to Journal” action remains a separately scoped idea.

Timers support an activity; they do not score performance. Lock-screen timers, Live Updates, microphone foreground services, and background execution are not included through this DRD.

## 8. Outcome and future preference

After finishing or stopping, ask briefly:

1. Did you try it or stop early?
2. Did it help: **not at all / a little / quite a bit**?
3. Would you like Mira to suggest it again in a similar moment?

Do not equate opening, accepting, or completing an activity with helpfulness. An unanswered question is not a negative outcome.

Future-use consent is a separate step: show the exact proposed preference and ask whether it may be saved. Keep feedback/history in the current session unless the person explicitly agrees to future use. Provide a return path without saving.

Saved preferences can be inspected, revoked, changed, and deleted in You. Do not infer a lasting personal trait from one interaction or quietly retain a negative preference.

The broader learning idea—offered → accepted → tried/completed → helpful → welcome again—helps distinguish friction from usefulness. It does not authorize persistent analytics or a new tracking system in V0.03.

## 9. You and Journal

Journal is the visual anchor: calm, private, spacious, with strong readable typography and minimal controls. Warm/tactile treatment is the current design preference to test.

You contains:

- A text draft editor and explicit Save.
- Record/transcribe a short note; edit the transcript before saving.
- Saved entries, deletion, and “Choose excerpt for Talk.”
- Excerpt review/edit/approval and later revoke/delete controls.
- Consented preferences and any history the person chose to save.
- Privacy explanation and demo reset.

Keep three choices visibly separate:

| Choice | Permission given |
|---|---|
| Save a Journal entry | Retain that entry in Journal. |
| Approve an excerpt for Talk | Allow that selected excerpt to be used as context. |
| Save an activity preference | Allow that preference to influence later suggestions. |

A saved entry is not automatic permission for Talk to read it. Show excerpt sources and approval state. Revocation/deletion must block future retrieval.

“Things that sometimes help” may show only consented, accurately described preferences. Do not turn it into inferred wellbeing scores, charts, streaks, counts, or a toolkit.

## 10. Required states and recovery

| Area/state | User-visible requirement |
|---|---|
| Talk ready / first use | Clear hold-to-talk instruction, available text mode, Help; no recording on entry. |
| Connecting / thinking / sending | Concise status; indicate what is happening without implying success. |
| Listening / speaking | Distinct text/icon cues for capture and output; interruption remains available. |
| Voice disconnected | Preserve visible session context; offer Retry voice and Continue with text. |
| Provider/server unavailable | Say Mira is temporarily offline. Text depends on the same available services; do not promise offline AI. |
| No approved context matched | Continue without requiring action; never imply an excerpt was used. |
| Matched approved context | Source and approval are visible; keep the notice secondary. |
| No eligible or valid activity | Continue listening or ask one question. No invented substitute. |
| Valid activity offer | One optional offer; accept/decline both clear. |
| Do loaded / active / paused | Explain the state and applicable controls; show canonical loaded content. |
| Do stopped / completed | Accurate end state and optional feedback; no success claim about wellbeing. |
| Journal empty | Simple invitation to write/record; usable editor, no onboarding obstacle. |
| Saving / transcription | Clear progress; prevent duplicate actions; retain editable drafts. |
| Transcription / save failure | Explain what failed; retry/discard where applicable; never show a false saved state. |
| Context / preference update failed | Retain the prior state and offer retry; do not mark approval/revocation complete prematurely. |
| Help / urgent help | Accurately label the demo boundary; never imply contact or a live handoff. |

No recording/caption history becomes permanent through error recovery. Development diagnostics stay out of ordinary demo presentation.

## 11. Visual system: direction selected, details open

**Working aesthetic:** restrained, warm, editorial, and spacious; simple call chrome and a tactile Journal. This is a design hypothesis, not a tested brand identity.

Compare the following on the same UX:

| Direction | What to explore |
|---|---|
| Ultra-clean / minimal | Typography and clear status with no central presence or minimal ornament. |
| Warm / tactile | Soft warm neutrals, restrained accent, gentle surface distinction. |
| Restrained character / 3D | One small presence element subordinate to controls and content. |

Explicitly compare **no/minimal presence, subtle abstract presence, and restrained 3D/character presence**. An orb is not required or the presumed winner. Do not mandate a realistic human face, video-call interface, avatar system, or heavy 3D implementation.

The earlier charcoal/cream/amber/plum direction and the current warm light/forest-green palette are starting treatments. Neither dark-first nor light-first is final. Test daylight and dark-room use before freezing the choice.

### Existing light palette: candidate tokens

| Role | Value |
|---|---|
| Canvas | `#F6F3EC` |
| Surface | `#FFFEFB` |
| Main text | `#242B25` |
| Supporting text | `#536257` |
| Primary action | `#3F6852` |
| Soft green | `#E8EFE8` |
| Border | `#D6D8CF` |
| Destructive | `#9A3D35` |

These are documented existing tokens, not an approved complete design system. Verify actual foreground/background pairs and every relevant state. A decorative light border must not be the only way to identify an interactive control if it lacks sufficient contrast.

**Typography:** Current sizes are title 30, heading 21, body 16, supporting 14. Use 16sp-equivalent as the body starting point and preserve user scaling. Lora headings/Raleway body is a proposal; system sans and other readable pairs remain candidates. Check English/Hinglish coverage, weights, and scaling before adoption; bundle adopted fonts locally with system fallback.

**Motion:** Prefer quiet, functional transitions. Recording/status must remain clear without animation. Provide reduced-motion/static behavior; avoid effects that compete with speech or text. Animation duration, sheet geometry, mascot assets, and rendering libraries remain implementation choices to validate.

## 12. Accessibility and Android constraints

The selected baseline is **WCAG 2.2 AA contrast plus Android accessibility basics**:

- Normal text: at least **4.5:1**; qualifying large text: **3:1**.
- Meaningful control/state graphics: at least **3:1** against adjacent colors where required.
- Interactive targets: at least **48 × 48 dp**, with adequate separation.
- TalkBack labels, roles, selected/disabled states, sensible focus order, and concise state announcements.
- Support Android text scaling without clipped instructions, hidden actions, or inaccessible sheets.
- Use text/icons as well as color for recording, connection, errors, and completion.
- Test hold-to-talk with TalkBack; keep text as a usable alternative.
- Accommodate keyboard, safe areas, Android back, and varied phone sizes.

Test sunlight readability separately. AAA contrast is not a global requirement; stronger contrast may be used where useful.

Real-world checks must cover shared-room privacy, either-hand use, low light, sunlight, background noise, headphones/no headphones, weak data, and mid-range Android performance. Do not invent guaranteed audio routing or silently add proximity/Bluetooth/background behavior. Test existing behavior and record gaps.

Use the primary OnePlus for the focused synthetic walkthrough and record its Android version. Broader hardware samples belong to research. FPS, GPU percentages, lux values, latency budgets, and exact thumb coordinates in earlier proposals are hypotheses, not verified guarantees.

## 13. Product, privacy, and implementation guardrails

The app remains a **private synthetic-data demo**, not a public pilot or clinical product.

- Preserve the nine catalog activities, canonical steps, deterministic eligibility, and backend validation.
- Preserve the four decision outcomes: listen, ask_question, offer_activity, human_support.
- Keep GPT behind the replaceable decision adapter. Jev is a future candidate, not this design's dependency.
- Keep one FastAPI service with separate catalog, decision, and eligibility modules.
- Retain React Native/Expo and the existing voice stack. Do not switch to Flutter or mobile web.
- Do not retain raw Talk audio/transcripts, raw brain dumps, or inferred traits in memory.
- Preserve persistent Help, synthetic demo reset, and the accurately labeled unconnected support placeholder.
- Preserve the exact existing emergency-demo trigger: `I am in immediate danger and need emergency help now.`
- That scripted trigger stops voice output and displays: “This demo is not crisis support and is not connected to Mpower. Contact local emergency services or someone you trust now.”
- This behavior is not general crisis detection. No classifier, clinician monitoring, automatic contact, or clinical endorsement is added.
- Reach Out helps prepare wording; the user contacts the person themselves.
- Mpower branding and wider-use review remain outside this design handoff's authorization.

Do not add accounts, analytics, a second backend, RAG/vector search, agents, open-ended interventions, clinical screening, a dashboard, or a browsing catalog.

### Existing implementation anchors

| Concern | Current files |
|---|---|
| Talk and Help | `mobile/src/Mira.tsx` |
| Do and activity patterns | `mobile/src/DoScreen.tsx`, `mobile/src/InterventionRunner.tsx` |
| You and Journal | `mobile/src/YouScreen.tsx`, `mobile/src/Journal.tsx` |
| Shared tokens/components | `mobile/src/ui.tsx` |
| Navigation | `mobile/src/app/_layout.tsx`, `mobile/src/app/(tabs)/_layout.tsx`, tab entries, `mobile/src/app/do.tsx` |

These paths come from the supplied map. The repository itself was not inspected in this compilation.

## 14. Research and design handoff

**Next deliverable:** Three clickable call-flow interaction prototypes, preserving the same V0.03 product rules. Vary presentation and transitions, not the intervention catalog or consent behavior.

1. Observe natural use before explaining controls or prompting edge cases.
2. Test starting a turn, understanding recording, responding to an offer, declining, stopping, switching to text, completing the representative activities, and returning.
3. Use scripted privacy/noise/network scenarios only after the initial observation or when the behavior does not arise naturally.
4. Fix comprehension problems before choosing visual identity.
5. Compare visual and presence directions on the same interaction layout; do not preselect a “hybrid winner.”
6. Check real Android constraints, TalkBack, scaling, and contrast.
7. Record observations, limitations, unresolved issues, and the evidence behind the chosen direction.

Reconcile the earlier 5–8 versus 6–8 participant ranges before recruitment. Set study thresholds explicitly; do not report proposed timing targets, review scores, or preference predictions as findings.

The implementation handoff should contain the chosen screens, state/transition examples, component behavior, tokens, typography, accessibility annotations, and referenced observations. A promising prototype does not by itself authorize changes to capture, retention, safety, or background behavior.

## 15. Acceptance checklist

Verify after prototyping/implementation; these are requirements, not completed checks.

- [ ] Talk reads as a call-style session and does not default to a dominant chat feed.
- [ ] Mira/status/Help and the three main controls are clear.
- [ ] Mic is off on entry; hold-to-talk, release, and interruption remain correct.
- [ ] Text conversation works without speaking; output/recording states are accurate.
- [ ] Only one valid activity is offered; decline/dismissal never starts it.
- [ ] Do starts only after explicit acceptance and returns to the same session.
- [ ] The nine activities use canonical catalog content and reusable presentation patterns.
- [ ] Start/skip/pause where relevant/stop/done/return are understandable.
- [ ] Outcome questions do not imply clinical benefit or require saving a preference.
- [ ] Journal, approved excerpts, and future preferences have separate consent and working delete/revoke controls.
- [ ] Failures preserve usable drafts/context without false success or invented activities.
- [ ] AA contrast, 48 dp targets, TalkBack, scaling, and Android layout behavior pass actual checks.
- [ ] Presence/color/font decisions are supported by documented comparison rather than assumed.
- [ ] The synthetic walkthrough preserves Help and the exact scripted emergency-demo boundary.
- [ ] Remaining prototype-only ideas and known issues are explicitly listed.

## Sources

- Supplied `CURRENT_UX(1).md`: current routes, components, states, recommendations, and updated research guardrails.
- `mira_prd.md`, 14 October 2026: authoritative V0.03 product scope and behavior.
- `mira_design_research_steps_6_7_8.md`: proposed study; overridden by the later guardrails where it predicts a winner or implies unsupported production behavior.
- Our supplied design conversation: selected call model, three controls, temporary decisions, Journal direction, open presence comparison, and accessibility choice.
- [W3C: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [W3C: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [Android Developers: Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps).
