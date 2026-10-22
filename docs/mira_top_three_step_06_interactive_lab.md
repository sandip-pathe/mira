# Step 06 — Interactive Direction A

Date: 2026-10-21. Status: complete in the browser lab. **Historical Step 06 completion record. The subsequent [native handoff](ui-native-handoff/README.md) is now prepared; native implementation remains pending. No mobile source, backend behavior, dependencies or EAS build changed in Step 06.**

Open [Mira UI Lab](http://localhost:5173/) for the selected A experience. The [previous control](http://localhost:5173/control.html) and [A/B/C comparison](http://localhost:5173/design/step-04/comparison-board.html) remain accessible. Presentation stays at 75%, with 360/412 logical-width choices.

## Implemented

| Surface | Working lab interactions |
| --- | --- |
| Talk | Mic off initially; pointer and keyboard hold/release; cancel without send on pointer cancel/blur; listening, waiting, reply, voice-off and failure states; labeled text composer with nonblank Send; failed-turn retry; conversation sheet; optional offer accept/decline; conversation retained across activity return and text/voice switching. |
| Activities | All nine catalog activities and the Journal shortcut; explicit latest preference first, once only; existing lab activity flows open inside the selected shell; returning respects Talk/library origin; saved activity work survives closing and reopening a flow within the browser session. Continue, saved takeaways/actions/wording and message drafts have supporting views/removal. Private letters stay inside Unsent Letter. |
| Journal | Tab opens a fresh entry; Activities → Journal opens recent sessions; home → New entry opens editor. Separate draft and finalized/read views. One optional prompt sheet; page color/writing-size sheet; writing always `#111111`; Save entry appends to the session and stays; Finish session finalizes and returns. Distinct local-save failure and saved-with-follow-up-failure feedback. Simulated tap-to-record/stop/save/discard, voice-note playback state and deletion. Excerpt review → pending → explicit approval, revoke/delete, and existing feedback reuse/delete controls. |

Blank state is fresh. **Load sample state**, outside the phone, deliberately adds synthetic preferred/saved/recent/feedback examples. The [fixture file](../ui-lab/design/step-06/preview-fixtures.json) is separate from app data and from the fair A/B/C comparison inputs. Nothing is imported from the real app or a database.

## Visual and interaction refinements

- Applied A’s oat/forest/peach system, local Nunito Sans and existing Material Design Icons across the three surfaces. Open rows and writing space keep decoration subordinate to content.
- Added matching attentive, thoughtful and replying mascot poses. The welcome/Activities/Journal art remains the selected original set. [Saved assets, exact generation prompt, provenance and motion storyboard](../ui-lab/design/step-06/artwork-and-motion.md) are recorded. Generation used the builtin image tool; no new animation or illustration dependency.
- Hold feedback stays above the mic as well as at the control. Pending/reply states use separate poses and labels. Animation is interruptible, respects reduced motion, stops when the view is hidden, and never gates input.
- The optional illustrative keyboard reserves layout space for editing; prompt/style sheets dismiss it. The text composer is a real browser textarea. Sheets support Escape, focus trapping and focus return.
- The existing activity pages retain their previous lab designs; this step changes the top three surfaces, rather than redesigning all activity experiences. A small same-origin frame/message bridge reuses those pages and carries mock saved work/preferences back to the new library.

## What is simulated

Voice, audio recording/playback, AI replies, support-service connections and saving are not connected to real services. The external banner says so. No microphone permission is requested. All user-entered text and mock saved items live in React memory and disappear on reload.

External controls choose the next Talk reply/offer/failure, Journal success/follow-up failure/save failure, saved-item read failure, phone width, keyboard layout and motion. The catalog and assets are bundled locally; a worker or saved-item failure does not hide the activity library. Mock replies are fixed comparison fixtures, not contextual AI output. The approved excerpt can be inspected in text mode; it is not sent anywhere.

Journal save clears the composer after appending the entry, matching the existing repository behavior. The writing remains visible in session history. A follow-up failure leaves that saved entry intact. Local save failure preserves the unsaved text. Finish is a separate operation and finalized sessions open read-only from recent sessions.

Saved takeaways/wording and feedback examples are available through the external sample loader because the older lab activity pages do not model all current native output-generation paths. Existing One Small Step, letter and Reach Out saves feed the new library/internal letter shelf. This step does not claim parity with every native activity flow.

## Review and limits

Rendered and visually reviewed welcome, reply/offer, text, library, saved action, Journal blank/writing, prompt/style sheets, saved follow-up, follow-up unavailable, recent sessions, and an existing activity page. Captured 360-width examples and a 412-width Journal view. No browser exceptions appeared during those capture passes. No lint/test suite or native build was run. Actual Android gestures, text scaling, keyboard/back handling, screen-reader interaction, real voice, real saving and performance remain unverified here.

Selected examples: [Talk](../ui-lab/design/step-06/talk-welcome.png), [text and offer](../ui-lab/design/step-06/talk-text-offer.png), [Activities](../ui-lab/design/step-06/activities-fresh.png), [saved action](../ui-lab/design/step-06/activities-saved-actions.png), [writing with keyboard](../ui-lab/design/step-06/journal-writing-keyboard.png), [follow-up unavailable](../ui-lab/design/step-06/journal-followup-unavailable.png), [recent sessions](../ui-lab/design/step-06/journal-home.png).

Implementation is deliberately small: `src/selected/App.jsx`, `Talk.jsx`, `Activities.jsx`, `Journal.jsx`, shared `ui.jsx`, and `selected.css`. The previous `main.jsx` is reused through `control.html` with a query-activated bridge; its standalone control behavior remains available.

## Stop point

Step 06 is complete. Its original stop before native handoff has been superseded by the user’s later instruction to prepare that handoff and begin the transition. See the [current native transition plan](ui-native-handoff/transition-plan.md) for batch progress.
