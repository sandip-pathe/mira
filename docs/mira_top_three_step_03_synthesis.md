# Step 03 — Deconstruction, synthesis, layouts, and copy

Completed: 2026-10-20. Based on the [Step 01 brief](mira_top_three_step_01_brief.md) and [Step 02 evidence](mira_top_three_step_02_research.md). This specifies candidates for comparison, not a selected visual direction or an implemented app change.

**Open the [layout and copy board](http://localhost:5173/design/step-03/layout-board.html).** It contains one annotated hierarchy study per surface, supporting-state selectors, 360/412-width comparison, and a searchable shared copy sheet. The [local board](../ui-lab/design/step-03/layout-board.html) and [comparison content](../ui-lab/design/step-03/comparison-content.json) are saved with the project.

## Five-layer donor records

Each record covers spatial/ergonomic roles, states/triggers, motion/rendering, sensory/haptic behavior, and copy/cognitive load. Claims are labeled observed, documented, estimated, unknown, or proposed. Original frames and source links are retained.

| Donor record | What it contributes | Important limit |
| --- | --- | --- |
| [Finch reflection](../ui-lab/design/step-03/deconstruction/finch-reflection.json) | Character-led browsing becomes a focused writing surface; input and receipt are distinct | Still iOS captures; native density, transitions, haptics, and current build unknown |
| [Keep voice](../ui-lab/design/step-03/deconstruction/keep-voice.json) | Explicit capture → visible result → updated collection | Historical official GIF; not current styling, latency, or a reason to copy automatic recording end |
| [Day One Android editor](../ui-lab/design/step-03/deconstruction/dayone-editor.json) | Writing, keyboard, contextual tools, and picker branches share the space | Guide screenshots, not a recorded continuous flow; not proof every extra toolbar step helps |
| [Duolingo feedback](../ui-lab/design/step-03/deconstruction/duolingo-feedback.json) | Action availability, local feedback, and expressive character response | The GIF cannot establish native frame rate, spring parameters, haptics, or audio |
| [Duolingo input states](../ui-lab/design/step-03/deconstruction/duolingo-states.json) | Different input modes have clear controls and alternatives | Related exercise templates; final image is a path screen, not a receipt |
| [How We Feel store set](../ui-lab/design/step-03/deconstruction/howwefeel-store.json) | A shape/color vocabulary can connect multiple surfaces | Marketing panels cannot establish a current flow, native text size, or an app canvas ratio |
| [WhatsApp voice features](../ui-lab/design/step-03/deconstruction/whatsapp-features.json) | Recording, waveform, preview, and playback describe different things | Static historical feature diagrams; full sequence and exact dimensions unknown |

The 360×800 frame is a common design reference. Source screenshots do not expose reliable dp values; region placement is qualitative, and exact donor touch sizes/open-canvas ratios remain unknown. No spring settings, audio cadence, haptic patterns, or reading-grade measurements have been invented. GIF timestamps describe the encoded assets only.

## Synthesis matrix

The playbook's formula remains explicit: emotional pacing + familiar consumer/game interaction − evidenced friction → Mira candidate specification.

| Surface | Borrowed patterns | Friction to remove | Proposed Mira result | Evidence |
| --- | --- | --- | --- | --- |
| Talk | Finch's coherent companion world; Keep's distinct capture/result states; Duolingo's responsive local feedback | A decorative hero crowding controls, unclear recording vs waiting, assistance obscuring the person's conversation | Give presence useful center space and adapt it when transcript/text/offer content appears. Keep the mic reachable and tied to actual capture. Use character/art changes to communicate state. Offer one activity with Try it / Keep talking. | Source sets above; R006, R048, R050, R055, R069 |
| Activities | Finch's illustrated entry/category/focused-action distinction; Keep's return to visible kept results; Duolingo's recognizable action states | Buried personal choices and recent work, too much competing content, repeated identical containers | Put explicitly reusable choices first, once only. Make Continue reachable without letting long saved-work lists precede the library. Distinguish groups through art/type/space; retain all nine activities and the Journal route. | R046, R061, R079, R087, R190 |
| Journal | Finch's one-question writing focus; Day One's context-aware editing tools; Duolingo's localized acknowledgment | Keyboard covering writing, tools/AI promotion interrupting the page, unstable text appearance, ambiguous saving | Writing gets the largest flexible area. Keep optional prompts/style/voice tools discoverable. Separate local entry save, online follow-up, and session finalization. A small illustration can greet the blank page and give way when space is needed. | R142, R147, R149, R153, R154, R156, R175 |

These outcomes preserve useful AI, rich illustrations, motion, and personality. The research argues for a clear relationship between them and the current task. It does not support a static worksheet treatment or removing capabilities because a competitor implemented them poorly.

## Common hierarchy, with room for different compositions

The board shows one possible arrangement to make priorities concrete. It is not a mandatory template for the three directions. In Step 04, change composition, illustration framing, shapes, surfaces, type, and motion substantially; preserve task priority, available actions, comparison content, and navigation.

Layout sizes below are starting design values, not measured donor values or locked app tokens. Design at 360×800 and also inspect 412×800. The 75% browser presentation is only a viewing scale. System/keyboard insets are placeholders in the studies and become runtime native insets in implementation.

### Talk layout

1. **Identity and Help:** a compact top region, with Help reachable and recognizable.
2. **Invitation/current state:** one heading and at most one useful supporting line. Welcome copy becomes listening/processing/error copy when appropriate; do not stack all messages.
3. **Flexible presence stage:** the strongest illustration belongs here. Start around 200–240 logical units for the subject's stage, then adapt to available height. The subject may be a character or object. It can move, react, and carry personality without implying the mic is on during welcome.
4. **Voice controls:** a prominent mic, secondary text entry, and end voice. Start with a 96-unit mic target and at least 48-unit secondary targets. Keep breathing room between the stage/copy and controls. Record/release status is readable near the mic.
5. **Tab navigation and system clearance:** retain the three destinations and normal native back behavior.

When the person types, the conversation and keyboard replace hero space. When conversation/context is expanded, shrink the hero before sacrificing readable content or the main action. An activity offer takes real content space; it cannot sit over the controls. Avoid forcing an identical full-size hero into every state.

Required visual differences: mic off/ready; getting voice ready; capture starting; recording; finalizing/processing; Mira speaking; voice retry; voice ended; text pending/failed; one activity offer. Holding while Mira speaks keeps the existing interruption behavior. Nothing starts recording automatically.

### Activities layout

1. **Title and short invitation:** identify the surface without an oversized decorative landing section.
2. **Your picks, when present:** only explicit future-reuse preferences. Show each activity once; do not infer favorites from browsing or rating sentiment alone.
3. **Grouped library:** preserve Express, Move forward, Take a break, and Follow a guide. Journal remains in Express even if all other Express items are promoted. Titles wrap naturally; descriptions are short and remain meaningful without an illustration.
4. **Continue and existing outputs:** a compact Continue count/shortcut near the top can jump to the existing in-page section. The full Continue/Saved takeaways/Saved actions/Saved wording sections can follow the library, keeping their current detail/remove actions. This changes presentation order, not storage or routes. Empty sections disappear.

The shortcut and section order are explicit design proposals for comparison. They are not already implemented or approved. Variants can explore alternatives with equivalent discoverability. Do not add a new global letters page, fake “recommended” content, search/filter features, or catalog loading gates as part of this task.

Start around 20–24-unit gutters, 16-unit row titles, 14-unit supporting copy, and 12–16-unit row gaps. Whole rows/tiles provide the touch target. Some variants may use illustrated groups or asymmetric compositions instead of rows; do not turn every item into a padded bordered card. All nine items are expected to scroll rather than being squeezed onto one screen.

### Journal layout

1. **Journal identity and Page style:** the existing background/writing-size controls remain recognizable. Writing stays dark (`#111111`) as the page color changes.
2. **Optional starting point:** show the current prompt and an optional prompt picker, without an interstitial or a required survey. One picker opens at a time and dismissal preserves the draft.
3. **Writing canvas:** start with 17-unit text and approximately 25–27-unit line height, adjustable through the existing writing-size control. Use open page space; the editor need not look like a nested form box. The accessible field label is separate from placeholder text.
4. **Writing actions and feedback:** Save entry is the primary action; Voice note is secondary. Keep the input/caret and save action usable with the keyboard. The board's 260-unit keyboard is an illustrative occlusion test, not an Android measurement.
5. **Session and supporting content:** retain session finalization, saved entries/follow-ups, saved audio, excerpt review, and existing feedback controls. Their hierarchy should not overwhelm a fresh page. Keep current home/recent-entry navigation as a supporting route.

Blank-page art is optional within each visual direction; it should leave room for the first word and recede as the page fills or keyboard opens. A strong illustrated empty state does not mean every written page needs a decorative hero.

Save entry appends locally and stays in the editor, then requests the existing AI follow-up. The proposed label **Finish session** maps to the existing **Save session** action: finalize locally, then return on success. It is not the same as leaving with a draft. A contextual helper explains that distinction. Finalized sessions remain read-only under the current behavior.

## State and feedback specification

| Event/state | Visible response | Continuity rule |
| --- | --- | --- |
| User presses/releases a control | Clear pressed/resting state without moving surrounding content | Do not wait for an illustration to finish before accepting an available action |
| Talk connecting | Connection wording, not a recording waveform | Record only once capture actually starts and the hold is still active |
| Talk recording | Active capture state plus release instruction | Release ends the user's turn; no VAD or mic lock is added |
| Talk processing → speaking | Distinguish pending reply from output audio | Preserve interruption and text switching |
| Voice/text failure | Existing retry and text options with specific status | Retain conversation/failed text; do not claim a worker never received a request when only the reply failed |
| Activity preference/kept work changes | Update the affected list/row with clear acknowledgment | Keep routes and scroll/content continuity; no automatic activity launch |
| Journal entry save succeeds | Confirm saved entry; follow-up may have a separate pending state | A delayed/unavailable follow-up does not become a failed-save message |
| Journal local save fails | Writing stays visible with retry status | No success flourish before persistence is confirmed |
| Voice note active/stopped | Recording, then Save voice note / Discard | This is Journal's existing tap/start-stop flow, distinct from Talk hold-to-speak; no transcription is implied |
| Prompt/style picker opens | Focused sheet with clear dismissal | Existing writing and dark foreground remain stable |

Motion for Step 04: give each transition a purpose, continuity, and interruption rule. Explore character motion, expressive shape response, and richer state transitions. Reserve their layout space so content does not jump while artwork loads. Exact timing/springs are candidate values, not recovered donor physics; disabled/reduced-motion presentations should preserve all state information. Sound/haptic choreography remains unmeasured in the references and must be proposed explicitly if desired, not presented as a verified donor property.

## Shared copy and fixtures

The board and [comparison-content.json](../ui-lab/design/step-03/comparison-content.json) contain **82 contextual copy entries**, nine candidate library descriptions, and fixed synthetic conversation, draft, follow-up, preference, Continue, and recent-session records. These are the common content for A/B/C, not native copy approval.

| Context | Shared comparison text |
| --- | --- |
| Talk welcome | “Hey. What’s on your mind?” |
| Supporting line | “No need to make it sound neat.” |
| Recording | “I’m listening.” / “Let go to send.” |
| Reply pending | “One sec…” |
| Activity offer | “Want to try One Small Step?” / Try it / Keep talking |
| Activities invitation | “What sounds doable right now?” |
| Explicitly reusable activities | “Your picks” |
| Journal invitation | “Start wherever you want.” |
| Existing default prompt | “How was your day?” |
| Entry action | “Save entry” |
| Session action | “Finish session” with an explanation of the existing finalization behavior |
| Follow-up failure after save | “Entry saved. Mira couldn’t add a follow-up right now.” |

Keep ordinary copy short, but do not force errors/decisions under a word cap at the expense of meaning. Do not duplicate state text in the hero, subtitle, control caption, and banner. Descriptions replace the stale Reach Out copy claim with available draft behavior; clipboard remains deferred.

Tone: contractions, direct actions, and a little warmth. No forced Gen-Z slang, pet names, assumed moods, fabricated memories, or praise for an outcome the app cannot know. “Peer” describes the tone; it does not imply Mira is a human friend. Personal content appears only when the actual product context supports it.

The comparison fixtures preserve activity titles and navigation. Surrounding headings/descriptions can be refined through selection. Existing support/context decision details remain available; this three-screen exercise does not remove their actions because the primary mockup is sparse.

## What Step 04 should explore

Produce three distinct visual worlds across all three screens. Derive their choices from the synthesis rather than treating earlier sample palettes as the answer. Compare differences in composition, illustration language, typography, color relationships, icon character, shape, and motion storyboards. Retain identical comparison text/data and test the same supporting states.

At least one direction should explore a strong character-led presence; the others can explore different illustration subjects or art treatments. Give Journal enough identity without turning it into another voice screen. Let Activities have inviting visual variety while the activity labels stay easy to scan. The current mascot and the control UI remain available as references, not mandatory assets or a predetermined winner.

**Optional before Step 04:** share any must-keep brand element, or one or two interfaces/illustration styles you love or dislike. No action is required. Without extra input, explore three distinct directions, including the character-led option.

## Status and handoff

Step 03 is complete: seven structured donor records, the three-surface synthesis matrix, annotated adaptive layout studies, state/feedback rules, and shared copy/fixtures are saved. The layout board can be viewed at 360/412 widths and 75% display scale. Visual design selection and native changes remain pending.

Browser inspection: the board rendered all 82 copy entries and nine activity descriptions, with no horizontal overflow in the three phone studies at 360 or 412 width. The supporting keyboard study kept Journal actions above the mock keyboard; no browser exceptions were reported. Saved views: [overview](../ui-lab/design/step-03/layout-board-overview.png) and [supporting states](../ui-lab/design/step-03/layout-board-supporting-states.png). This checks the research board, not native keyboard/voice/save behavior.

Step 04 is next: three directions × three main screens, with palette/type/illustration/motion rationale and common state comparisons. No EAS build, native code change, or app UI change was made in this step.
