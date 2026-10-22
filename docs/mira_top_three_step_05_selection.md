# Step 05 — Direction A selected

Date: 2026-10-21. Status: complete. **A — Little company is the selected direction for the next lab iteration.** The user also likes B; retain it as an alternate reference. No specific B element has been requested for A. The choice can be revisited with feedback.

Scope: Talk, Activities, Journal, and their existing supporting states. The comparison board remains available. **Step 06 update: interactive A is now at `/`, and the previous control is preserved at `/control.html`.** Mobile is unchanged. The critique and original next-batch notes below record the selection step.

## Five-gate critique

This is a design critique of the [nine mockups and supporting states](mira_top_three_step_04_designs.md), informed by the [synthesis](mira_top_three_step_03_synthesis.md). It is not a participant study or a claim of measured Android performance. Each cell records a finding and a concrete response.

| Gate | A — Little company | B — Clear head | C — Room to think |
| --- | --- | --- | --- |
| One-handed use | The lower round mic and adjacent text action are easy to identify. The recording instruction below the mic can be covered by the holding finger. **Keep the upper “I’m listening.” / “Let go to send.” feedback visible; let the art shrink before controls move.** | The dock groups actions well, but its stronger surface competes with an offer and consumes more height. **Keep offer actions outside the dock; collapse decorative space first on short screens.** | The wide voice action is a generous target; secondary controls sit directly below it. **Keep those actions separate by at least 8 logical units and preserve their labels when text grows.** |
| Shared-room presentation | The warm character is distinctive and ordinary labels avoid a clinical dashboard. Excessive expressions could make it feel juvenile. **Keep the relaxed pose; avoid guilt, absence reactions, or reward overlays.** | The sculpture is discreet and mature; the pale palette needs careful functional contrast. **Use the dark action color for labels and retain visible text for recording state.** | The cup and notebook feel familiar and adult; small drawings can clutter writing. **Remove the Journal invitation art once writing begins, as shown in the candidate.** |
| Silent/text use | “Type instead” is immediately available. The text mockup still uses a placeholder span rather than a real composer. **Step 06 uses a labeled textarea, nonblank Send state, and preserves the conversation when switching modes.** | Text is equally available, but the voice dock’s visual emphasis could carry into text mode. **Remove the dock in text mode and give the composer the main action.** | The broad voice action is prominent, with text below. **Keep text equally operable without starting voice; retain captions/conversation access.** |
| Plausible Android rendering cost | One transparent clay plate and restrained transforms are straightforward candidates. The PNG is about 1.47 MB compressed; decoded RGBA pixels are about 6 MiB before platform overhead. **Load A’s assets for the selected view, reserve art space, stop ambient loops when hidden, and finish state poses without blocking input.** | A still PNG can represent the sculpture without realtime 3D. **Keep its depth in artwork; use transform-based motion rather than adding a live renderer merely to reproduce the still.** | Paper and ink need only modest imagery and simple transitions. **Avoid full-screen texture compositing; stop decorative motion during editing.** |
| Natural, concise copy | The shared welcome and writing invitation sound informal without invented familiarity. A silent button-press effect cannot explain save failures. **Show the existing accurate save, follow-up, and retry messages at the affected action.** | Uses the same copy, so no copy advantage from the palette. **Preserve full canonical activity titles and wrapped summaries inside tonal groups.** | Uses the same copy; editorial styling must not turn prompts into mandatory instructions. **Keep prompt picking optional and retain the separate Save entry / Finish session labels.** |

All three are viable visual candidates with the responses above. Actual thumb reach, Android font scaling, native keyboard/back behavior, accessibility interaction, frame rate, and audio latency remain for native execution. No new voice mechanic, privacy screen, sensor interaction, or activity is introduced by these gates.

## Why A is the working choice

| Consideration | Judgment |
| --- | --- |
| Helpful peer | A’s relaxed companion gives Talk the strongest personal presence. B is more abstract; C is more editorial. This is design judgment, aligned with the user’s choice. |
| Obvious next action | A’s round mic, explicit Hold to talk label, and visible text alternative establish a simple hierarchy. Preserve it in recording and retry states. |
| Reading comfort | A’s Nunito Sans, oat canvas, and open rows work across all three surfaces. Existing contrast calculations support the selected foreground pairs. |
| Connected visual world | The sprout, note/pebbles, and book/leaf belong together. Talk owns the largest art; writing owns Journal. |
| Native translation | Semantic colors, local font files, ordinary flex layout, existing icons, and illustration assets give a clear transfer path. The exact Android font registration and animation implementation belong to the handoff. |

## Accepted direction

- **Palette:** oat `#F7F1E7`, warm surface `#FFF9F1`, ink `#263C31`, muted text `#5B675E`, forest action `#315A45`, soft green `#E5E8DB`, peach `#DEA68D`. Remaining semantic states are in [A’s token record](../ui-lab/design/step-04/directions.json).
- **Type:** Nunito Sans; titles around 30/35, body 16/23, support 14/20, writing 17/28. Keep actual logical units when transferring; 75% is only the comparison presentation.
- **Illustration:** tactile clay sprout companion for Talk, related small Activities and Journal motifs. Preserve the welcoming still direction while developing expressive state poses in Step 06.
- **Layout:** centered Talk invitation with breathing room above the lower controls; open Activities rows and a preferred section; open Journal editor with small optional art. Straight-edged bottom navigation.
- **Icons:** existing Material Design Icons; outline tools and recognizable labeled actions. No new icon library.
- **Copy and behavior:** carry the shared comparison copy into the selected lab, retaining accurate existing states. Mic off by default, hold/release for Talk, optional activity offers, explicitly preferred activities first, local catalog, separate Journal home/editor, and black writing text remain intact.

The old Roboto/palette/layout decision is superseded for these three surfaces’ future visual work. Keep its history and the control implementation. Material Design Icons and the 75% comparison scale remain accepted. Other activity screens are outside this visual selection.

## Refinement and next batch

No palette or composition blend is needed from the feedback received. The concrete refinements from the critique are recorded above for Step 06: maintain upper recording feedback, reserve control space, implement an actual text composer, and display accurate save/error states. They are not marked implemented by this selection document.

**Next: Step 06, Talk first.** Build the selected A Talk experience in the lab, including hold/release feedback, waiting/reply, text, captions/conversation, offer accept/decline, and retry layouts. Keep browser simulation distinct from live AI/voice. Then continue Activities and Journal in separate batches. No EAS build is needed for these lab iterations.

Optional before the next batch: mention a specific thing from B only if you want it carried into A. Otherwise proceed with A as shown; no further choice is required.
