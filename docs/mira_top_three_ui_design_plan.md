# Mira: three-screen UI design plan

Status: Steps 01–07 complete. A — Little company and its branding decisions are locked in the Lab. Native RN-00 through RN-16 are complete, including the three selected screens, saved outputs/shared controls, all nine activity styling passes and the global theme finish. RN-17 Android review is next in the [transition plan](ui-native-handoff/transition-plan.md). Phone/live voice review is pending; EAS builds are on hold at the user's request.

## Goal and scope

Use the [UI/UX synthesis playbook](../ui-lab/mira_ui_ux_synthesis_driven_design_system.md) to develop and compare three coherent visual directions for **Talk, Activities, and Journal**. Mira should feel personal, informal, and helpful to a young adult: a thoughtful peer with taste and personality. Give the experience distinctive illustrations, strong typography, clear actions, and expressive state changes.

Treat the current UI as a control for comparison. New candidates can change the palette, typefaces, illustration style, icon treatment, layout, sizing, and copy. The current locked baseline stays recorded until a replacement is selected; creating a candidate does not approve it.

The work happens in the UI Lab first. Preserve its 75% presentation scale, but design in logical phone units. A 16-unit text size must not become a 12-unit native specification because the comparison preview is scaled.

| Surface | Primary composition | Supporting states to specify |
| --- | --- | --- |
| Talk | Welcome, presence/mascot, voice and text entry, Help | Holding mic, waiting, Mira speaking, text composer with keyboard, existing retry/text fallback, one activity offer |
| Activities | Browsable library, useful grouping and priority, concise descriptions, existing saved/continue access | Preferred activity promoted to the top, empty/saved work presentation, return from an activity |
| Journal | New entry editor, writing tools, prompts, clear save action | Blank and written entry, keyboard open, prompt picker, saving/error feedback; a small navigation sketch for the existing recent-entry home |

These are three top-level surfaces, not a redesign of all nine activity experiences. Journal's recent-entry home is an existing supporting route, not a fourth full visual direction. Keep **Journal tab → new entry** and **Activities → Journal → recent-entry home → new entry**.

## How to adapt the playbook

Use its reference harvesting, evidence extraction, friction analysis, synthesis, and focused implementation sequence. Adjust the following to fit the task:

- Research three screens and their key interactions, rather than running a nine-activity redesign.
- Preserve the playbook's three-donor triangulation for each surface: one emotional-pacing reference, one familiar consumer-flow reference, and one tactile/game-feel reference. References may overlap across surfaces, but record the contribution of each donor explicitly.
- Record what screenshots show. Timing requires video; haptics require documentation or device observation. Mark inferred details as hypotheses, never measured facts. Do not invent review quotes, spring parameters, or performance results.
- Treat the playbook's review claims and proposed mechanics as hypotheses until supported by sources. Its replacement activity catalog, forced dark surfaces, mic locking, automatic VAD, and sensor gestures are proposals in the attachment, not requested product changes.
- Keep current product behavior, explicit hold-to-talk, local activity availability, and existing AI capabilities. Represent AI's actual states clearly in the designs.
- Use adaptive layout and safe areas rather than fixed vertical coordinates. Android 48 dp targets and readable text are part of the specification.
- Choose the rendering approach after the visual idea. Plan native implementations using the installed React Native, SVG, and Reanimated capabilities; identify a new tool only if an accepted effect requires it. Check installed versions before writing native APIs.

## Step 01 — Screen brief and behavior inventory

Read the three native surfaces and record what each currently lets the person do. Identify which details the lab already mirrors and which are only mock interactions.

For each screen, define one purpose, its main action, secondary actions, relevant content, and return behavior. Map the required states in the scope table. Record important details such as activity promotion, journal save feedback, and the difference between recording and waiting for a reply.

Deliverable: a short screen brief and state map, with the current control screenshots when execution starts.

Done when: the three variants can share the same content and behavior, allowing a fair visual comparison.

## Step 02 — Focused reference harvesting and friction research

Choose references through the playbook's three-donor method for each surface. Candidate sources from the playbook:

| Surface | What to study | Candidate references |
| --- | --- | --- |
| Talk | Presence, voice controls, readable captions, quiet text entry | Finch or Headspace for character/pacing; WhatsApp for familiar voice feedback; Spotify for information hierarchy |
| Activities | Finding something quickly, visual grouping, personal priority | How We Feel, Finch, Tiimo |
| Journal | Inviting blank state, writing comfort, tools around the keyboard | Google Keep, Day One, Apple Journal where accessible |

Use accessible official material and current flow recordings; use Mobbin/Page Flows/Appshots when access is available. Substitute a source if it is inaccessible rather than stopping the work for a subscription. Borrow interaction principles, not a competitor's artwork or full composition.

Capture four to six relevant frames per flow, including entry, active state, peak interaction, transition, and completion where applicable. Record the source/date and what we want to learn; include a short recording when it is available to inspect motion. Do not stage a completion state for a flow that has none.

Follow the playbook's friction-mining depth: target 150–200 recent, relevant low/mixed-rating reviews across the donor apps, with 2-star and 3-star reviews central to the sample. Deduplicate, retain source references, and group by the actual failure described. Record repeated friction such as crowded controls, writing interrupted by prompts, slow entry, unclear save states, or pressure to complete something. If accessible evidence falls short, report the actual sample and the gap; do not quietly replace the target with a handful of examples or invent complaints. A recurring complaint is a design signal, not a representative population finding.

Deliverable: reference strips/recordings, a sourced review corpus, a clustered friction report, and an evidence-backed anti-pattern rulebook. Keep unsupported concerns labeled as hypotheses.

## Step 03 — Deconstruct and synthesize

Apply the playbook's five-layer deconstruction: spatial/ergonomic layout; states and transition triggers; motion/rendering; sensory/haptic behavior; and copy/cognitive load. Use 360×800 as the reference frame and check a wider phone layout, without fixing all content to absolute coordinates. Produce a structured deconstruction record per donor flow, distinguishing observed values, documented values, estimates, and unknowns.

Build a three-surface synthesis matrix using the playbook's formula: **emotional-pacing donor + consumer/game-feel donor − evidenced friction = Mira design specification**. For each borrowed pattern, explain why it fits and how Mira changes it. Establish a common navigation structure and content order across variants. Capture where the hero belongs, how the main action stays reachable, how long text wraps, and what gives the screen breathing room.

Deliverable: donor deconstruction records, the synthesis matrix, one annotated layout per screen, and a shared copy sheet. These specify the existing three surfaces rather than new activity state machines.

## Step 04 — Produce three complete visual directions

Build three coherent systems across the same three screen compositions: **nine main screen mockups total**. Make them meaningfully different in composition, typography, illustration, and surface treatment, rather than recoloring the same layout.

Choose the three directions after reference deconstruction and synthesis. Each must explain how its palette, typography, illustration, and layout follow from the evidence and intended Mira experience. Do not use predefined moodboards to determine what the research should find. The following are optional contrasts to explore, not a predetermined shortlist or approved tokens:

| Candidate | Palette starting point | Typeface candidate | Illustration and styling |
| --- | --- | --- | --- |
| A — Warm and playful | Oat `#F6F0E6`, ink `#252A27`, deep rust `#A84B38`, peach `#F2C9AD` | Nunito Sans, using weight and scale for hierarchy | Expressive character poses, rounded drawn objects, generous open space, selective soft shapes |
| B — Clear and colorful | Pale mint `#EDF5EE`, dark pine `#173A34`, deep teal `#23695B`, soft lilac `#DCD7F1` | DM Sans | Geometric illustration scenes, bold shapes and clean text, tonal sections with few containers |
| C — Personal notebook | Warm paper `#F5F0E8`, ink `#2E2A38`, plum `#654563`, muted apricot `#E7BA99` | Manrope for interface/body; Lora only for occasional display text | Loose line drawings, restrained paper detail, editorial spacing, quieter controls |

Choose accessible foreground/background pairs after checking the actual combinations. Each system needs semantic colors for canvas, surface, primary/secondary text, action, selected, pressed, disabled, and error states. Accent colors need not become every screen's background.

Specify a clear type scale in native units: explore titles around 28–32, section headings 20–22, body 16–17, supporting text 14, and functional labels 14–16. Specify line heights and weights too. Use an approximately 4/8-unit spacing rhythm, with 20–24-unit screen gutters as a starting point. Check real copy and enlarged text before finalizing.

Define a consistent icon family and stroke/fill convention for each candidate. Use illustrations for personality and icons for recognizable actions. Do not put every icon or content block inside a bordered rounded box.

Illustration brief: one connected visual world per candidate, including a Talk hero, one Activities scene or motif, and a small Journal illustration. Talk owns the strongest hero; Journal leaves space for writing. Show useful character states without guilt, sadness for absence, or reward pressure. Plan cropped/detail views so the same art works at different phone sizes.

For initial comparison, use convincing still artwork and a short motion storyboard. Once a direction is selected, produce its finished asset set and motion states. High-impact effects remain welcome where they improve the experience.

Deliverable: a comparison board with all nine screen mockups, palette swatches, font samples, sizing, icon examples, and illustration notes. Present the same screen/state at the same viewport and scale across candidates.

## Copy direction across every candidate

Write in natural conversational English: young, warm, direct, and a little personal. Use contractions and short prompts. Avoid clinical worksheet labels, forced slang, pet names, fake familiarity, and assumptions about what the person feels. Do not insert Hinglish by default; consider it only as a deliberate copy choice supported by feedback.

| Context | Candidate wording to refine |
| --- | --- |
| Talk welcome | “Hey. What's on your mind?” |
| Supporting line | “You don't have to make it sound neat.” |
| Voice instruction | “Hold to talk. Let go when you're done.” |
| Activities intro | “What sounds doable right now?” |
| Journal blank state | “Start wherever you want.” |
| Optional journal prompt | “Need a starting point?” |
| Existing activity offer | “Want to try one small step?” |

Keep navigation labels recognizable. Preserve approved activity titles and meanings while refining surrounding headings and descriptions. Use personal details only when existing product data supports them; never fabricate a name, memory, or emotional assessment.

Favor one short heading and one helpful supporting line. Allow longer copy where an error or decision needs it; the playbook's universal 12-word cap is not a requirement. Save, retry, discard, and voice states must say what actually happened. Explain choices at the point they matter without filling ordinary screens with process text.

## Step 05 — Compare and select

Let the user compare the three candidates on one board, with side-by-side or tabbed views. Ask for one concise choice: preferred direction, any element worth borrowing from another, and anything that feels wrong. Keep the existing lab available as the control.

First run the playbook's five-gate critique against each direction: one-handed use, comfortable shared-room presentation, silent/text use, plausible Android rendering cost, and natural concise copy. Supply a finding and concrete fix for each gate. Use responsive native layout instead of fixed-coordinate pass/fail rules; flag measured performance as pending until actual native execution. Apply these gates to the existing product flows without introducing new voice or sensor mechanics.

Then compare whether each direction feels like a helpful peer, makes the next action obvious, reads comfortably, gives the art personality, connects the three screens, and translates cleanly to React Native.

If a direction wins, refine it once with specific feedback. If none works, revise the strongest candidate using the reasons given. Avoid producing more variants without a clear question to resolve.

Deliverable: the selected direction and accepted changes recorded in [the UI decision log](mira_ui_decisions.md). Preserve earlier decisions as history and mark only replaced choices superseded.

## Step 06 — Make the selected direction interactive in the lab

Implement one screen at a time: **Talk → Activities → Journal**. Use direct React/CSS and local assets with the existing mock navigation. Keep variant comparison simple; a small selector or separate preview route is sufficient.

For Talk, cover welcome, hold feedback, waiting/reply, text mode, and existing offer/fallback layouts. For Activities, show the real catalog, preferred-first placement, and existing continuation paths. For Journal, cover editing with the keyboard, optional prompt selection, and accurate save/error feedback. Keep recent-entry navigation intact.

Finish illustration and motion assets for the selected direction. Specify what motion communicates, the trigger, duration/easing or spring, interruption behavior, and a reduced-motion alternative. Do not claim that browser mock voice, saving, or AI replies validate native capabilities.

Deliverable: one clickable three-screen candidate in the UI Lab, including relevant states and the comparison board.

## Step 07 — Record the native handoff

Write the accepted semantic tokens, font weights/files, icon names, layout measurements, illustration assets/crops, copy, states, and motion notes into a concise implementation specification. Add a concrete mobile file mapping:

- Talk: `TalkScreen.tsx`, `TalkHeader.tsx`, `PresenceHero.tsx`, `TalkCallControls.tsx`, and the text panel/composer.
- Activities: `features/actions/ActionsScreen.tsx` and its existing navigation/saved-work entry points.
- Journal: `JournalEntryScreen.tsx`, `JournalHomeScreen.tsx`, `components/journalStyles.ts`, and existing pickers.
- Shared visual tokens: `components/ui/tokens.ts`; apply shared changes deliberately to avoid accidentally restyling activity experiences outside this scope.

Then implement in the real app one surface at a time when that work is requested. Prefer logical native sizing, adaptive flex layout, system text scaling, safe areas, and native keyboard behavior. The browser's 75% zoom is never ported as a native transform.

Review each completed surface briefly on the target Android phone, concentrating on keyboard/back behavior, touch targets, text wrapping, and the actual voice/save states. Browser comparison is sufficient for choosing a visual direction; native behavior is checked during transfer. Do not start an EAS build for every UI iteration.

Deliverable: a reviewable native change list with decisions marked `Locked in lab; native transfer pending`, then `Implemented in mobile` as each transfer is completed.

## Execution ledger

Steps 01–07 are complete as design and handoff work. The latest user instruction authorized this handoff and transition plan. Execute subsequent native work one RN-numbered batch at a time when requested, beginning with RN-00. Translate Talk, Activities library and Journal before propagating the shared foundation through the remaining screens; each activity’s individual composition remains open.

| Step | Work | Status |
| --- | --- | --- |
| 01 | Three-screen brief and behavior inventory | Complete — [brief, state inventory, and screenshots](mira_top_three_step_01_brief.md) |
| 02 | Reference board and focused friction research | Complete — [34 frames, 170 reviews, friction report](mira_top_three_step_02_research.md) |
| 03 | Synthesis, layout annotations, shared copy | Complete — [seven donor records, layout board, copy/fixtures](mira_top_three_step_03_synthesis.md) |
| 04 | Three directions × three screens | Complete — [nine mockups, local fonts/art, state comparison board](mira_top_three_step_04_designs.md) |
| 05 | Comparison, selection, and decision record | Complete — [A selected; five-gate critique for all three](mira_top_three_step_05_selection.md) |
| 06 | Interactive selected direction, one screen at a time | Complete — [A Talk, Activities and Journal; browser simulations and limits](mira_top_three_step_06_interactive_lab.md) |
| 07 | Native handoff specification and ordered change list | Complete — [handoff package](ui-native-handoff/README.md), [RN batch plan](ui-native-handoff/transition-plan.md); native work pending |
