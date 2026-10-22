# Mira UI Lab

A small browser-only place to try Mira screen layouts and interactions. This is an isolated Vite app; Mira Mobile stays the source for real app behavior.

## Run

```powershell
cd ui-lab
npm install
npm run dev
```

Open the local URL printed by Vite. The phone preview is scaled to match the 75% view used during design review and fills a narrow browser viewport.

The main preview at `/` now implements selected Direction A with Nunito Sans, local clay illustrations, and its oat/forest/peach semantic palette. The previous control at `/control.html` uses Roboto and the earlier mobile baseline. Both use the existing local Material Design Icons. The lab does not import mobile source code or depend on the app at runtime.

Accepted visual decisions and the corresponding native app handoff are tracked in [the UI decision log](../docs/mira_ui_decisions.md). Record accepted choices there during future iterations.

The [three-screen design exploration plan](../docs/mira_top_three_ui_design_plan.md) tracks the research and comparison process for Talk, Activities, and Journal. Step 01 is complete: [screen brief, states, and control screenshots](../docs/mira_top_three_step_01_brief.md). New candidates do not replace accepted decisions until selected.

Step 02 is complete: [reference/friction report](../docs/mira_top_three_step_02_research.md). With Vite running, open `/design/step-02/reference-board.html` for the source images, animated examples, and searchable review corpus.

Step 03 is complete: [synthesis, layouts, and copy](../docs/mira_top_three_step_03_synthesis.md). Open `/design/step-03/layout-board.html` for the annotated studies and shared copy sheet. These are candidate specifications, not changes to the current app or an approved visual direction.

Step 04 is complete: [three directions, nine screens, and specifications](../docs/mira_top_three_step_04_designs.md). Open `/design/step-04/comparison-board.html` for A/B/C, local illustrations and fonts, synchronized state selectors, and 360/412-width previews at 75%.

Step 05 is complete: [Direction A selected and five-gate critique](../docs/mira_top_three_step_05_selection.md). B remains an alternate reference.

Step 06 is complete: [interactive A, scope and limits](../docs/mira_top_three_step_06_interactive_lab.md). Talk, Activities and Journal are wired in that order at `/`. External controls show reply/save/error scenarios, widths, keyboard layout, motion, and optional synthetic saved/recent examples. [Illustrations and motion](design/step-06/artwork-and-motion.md) include the exact generated pose prompt. The [native handoff package](../docs/ui-native-handoff/README.md) is ready; RN-00 through RN-15 (including the three selected screens, saved outputs/shared controls and the all nine activity styling passes) are complete. See the [RN transition plan](../docs/ui-native-handoff/transition-plan.md) for the next batch and EAS build hold.

## Current screens

- Talk hold/release, waiting/reply, text, conversation, offers, retry and offline layouts
- A’s grouped offline library, explicit preferences, existing activity flows and saved-work views
- Journal home, fresh editor, prompt/style sheets, keyboard, entry save/follow-up, session finish and recent-session reading
- Saved letters inside Unsent Letter; message drafts and action cards available through their relevant library sections

All interaction state stays in browser memory and resets when the page reloads. The activity catalog is a static copy. Voice, audio and AI replies are simulated; no microphone permission is requested. No API, account, private app data, native module, or build service is connected. Existing activity pages are reused through a same-origin frame and a small query-activated message bridge in `main.jsx`; they retain their previous designs.
