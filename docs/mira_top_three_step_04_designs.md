# Step 04 — Three visual directions

Status: complete as comparison studies. **Update 2026-10-21: A selected in [Step 05](mira_top_three_step_05_selection.md); B retained as an alternate. Step 06’s interactive A is now at `/`, with the previous control at `/control.html`.** The notes and exported screenshots below describe the original comparison studies. Mobile is unchanged.

Open [the comparison board](http://localhost:5173/design/step-04/comparison-board.html) while Vite is running. [All nine screens](../ui-lab/design/step-04/all-nine.png) are also exported as a static overview. Choose a surface to compare it at a larger size; the controls synchronize width and state across all candidates. The phone previews remain at 75%, with logical 360 × 800 and 412 × 800 layouts.

## The candidates

| | A — Little company | B — Clear head | C — Room to think |
| --- | --- | --- | --- |
| Feeling | Warm, tactile company | Expressive, clear, contemporary | Personal, editorial, quietly human |
| Canvas | Oat `#F7F1E7` | Chalk lilac `#F1EEF9` | Paper `#F8F2E8` |
| Ink / action | `#263C31` / `#315A45` | `#302745` / `#594476` | `#263543` / `#2F5271` |
| Accent | Peach `#DEA68D` | Citron `#DDEAAB` | Apricot `#EDC0A1` |
| Typography | Nunito Sans | Outfit | DM Sans; Lora for selected display headings |
| Talk | Centered welcome, clay sprout companion, open round mic | Left aligned bold welcome, loop sculpture, tonal voice dock | Editorial greeting, cup/steam still life, broad voice action |
| Activities | Open icon rows; one soft preferred block | Tonal category groups; citron preferred block | Illustrated index, rule-separated preferred section, no item boxes |
| Journal | Open writing space, small book/leaf | Small folded-paper banner and quiet writing surface | Paper-like writing space, fine rule and small notebook drawing |

### Evidence to design

- **A:** Finch’s companion and Headspace’s quiet focal point support a visible presence. The review corpus argues against guilt, completion pressure, and interruptive celebration. Use a relaxed character, not a progress pet. Keep’s quick entry informs the open activity rows.
- **B:** How We Feel’s color grouping, Spotify’s action hierarchy, and Tiimo’s visual activity identity inform a stronger graphic system. Color marks useful groups; explicit preferred activities remain first. Titles and descriptions stay visible instead of becoming unlabeled pictures.
- **C:** Day One’s writing space, Keep’s low-effort entry, and Headspace’s editorial art inform an adult notebook direction. Writing tools remain available; the illustration disappears from written/keyboard states to preserve space. Entry save and session finish remain different actions.

These are design inferences from the [Step 03 synthesis](mira_top_three_step_03_synthesis.md), not measured user preferences. The [research report](mira_top_three_step_02_research.md) retains source evidence and limitations.

## System and sizing

[directions.json](../ui-lab/design/step-04/directions.json) records canvas, surface, ink, muted text, action, soft selected, accent, line, pressed, disabled, disabled text, and error colors for every direction. Selected navigation combines an icon background, icon color, and stronger label. Errors use accurate words, not color alone. Disabled controls use a muted fill or subdued secondary action.

Base logical units: titles 30/35 at 600, sections 20/25 at 600, body 16/23 at 400, supporting text 14/20, writing 17/28, navigation 12/16. Talk B explores a 34-unit display; C uses Lora at 29 with a looser line height. Library titles are 17/22, summaries 14/20. Screen gutters 22–24; spacing mostly 8/12/16/24. Actions have at least 48-unit height, with 48-unit icon targets. A’s mic is 92 diameter; B’s is 84; C’s full-width voice action is 62 high.

All candidates use the existing local **Material Design Icons** font: outline icons for navigation/tools, recognizable mic, text, end, caption, notebook, letter, movement, and music symbols. Icons are not illustration substitutes. Navigation has a straight top edge; no curved bar. C deliberately omits activity-row icons for an editorial index.

The font files and OFL licenses are local: [font source manifest](../ui-lab/design/step-04/assets/fonts/manifest.json). Sources: [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans), [Outfit](https://fonts.google.com/specimen/Outfit), [DM Sans](https://fonts.google.com/specimen/DM+Sans), [Lora](https://fonts.google.com/specimen/Lora). Variable TTFs are archived as native candidates; no native font loading has been implemented. Browser type metrics are not a guarantee of identical Android wrapping.

Journal writing remains `#111111` in every direction. The selected page color must never recolor writing text. The initial page colors shown here are candidates, not replacement behavior for the existing page-style picker.

## Illustrations and motion

Three original transparent plates provide nine connected motifs: a Talk hero, an Activities motif, and a small Journal drawing for each direction. Generated through the **builtin image tool**, copied unchanged into the project. [Exact prompts, output paths and crop coordinates](../ui-lab/design/step-04/artwork-provenance.md) are recorded. These are convincing still assets; expressive character poses and finished animated states follow selection.

| State | A | B | C |
| --- | --- | --- | --- |
| Welcome | Proposed 6s, 3px companion float | Proposed 8s, 2° sculpture drift | Proposed 7s, 2px still-life drift |
| Hold begins | 120ms control compression; static recording ring | Same, citron control | Same, broad voice action |
| Release / waiting | Capture ends; separate three-dot state | Same | Same |
| Reply | Companion tilt concept | 240ms shape settle concept | 200ms ink reveal concept |
| Interrupt / leave | Stop hold state immediately; cancel ambient motion if backgrounded | Same | Same |
| Reduced motion | No ambient loop; immediate meaningful state changes | Same | Same |

The board’s optional motion toggle previews ambient movement only. The state selector shows recording, waiting, and speaking distinctly. It does not simulate live capture or validate native latency. Native animation timing, haptics, compositing cost, and frame rate remain unmeasured. Use installed native capabilities after selection; these effects do not justify an extra library by themselves.

## Same content and behavior

All nine use the [same shared copy and fixtures](../ui-lab/design/step-03/comparison-content.json). No fabricated name, remembered mood, or context. Warm English rather than forced slang. Activity titles remain canonical.

- Talk: welcome, hold, waiting, reply, retry/text fallback, text plus keyboard, and one optional offer. The mic is off on welcome. Hold/release remains the approved interaction. The offer gives **Try it** and **Keep talking**. Caption control represents existing conversation access.
- Activities: offline library, one explicitly preferred activity first, fresh fixture without a preference, and a kept-work fixture with **Continue (1)** scrolling to the existing kept-work section. Journal is always present under Express. It leads to the existing recent-session home, not directly to a new editor. No saved-letters section is added to the library.
- Journal: blank, written draft, keyboard, and saved-with-follow-up-unavailable layouts. **Save entry** stays in the editor and differs from **Finish session**. Voice note retains its existing tap-to-record behavior. Journal tab means a new entry; its recent-session home remains a separate route.

The screen controls are mockup affordances; use the external selectors to inspect states. Real navigation, prompts, saving, voice, and AI are not connected. Implementing the selected direction’s interactions is Step 06.

## Focused browser review

Rendered all nine with local fonts and illustrations in headless Edge. Reviewed the overview, keyboard composition and offer state visually; fixed an unintended offer container border and sideways Activities scrolling. Checked 360 and 412 frame widths, font loading, horizontal overflow, and Journal action placement above the illustrative keyboard. No browser exceptions during the capture pass. [Keyboard comparison](../ui-lab/design/step-04/compare-journal-keyboard-412.png), [offer comparison](../ui-lab/design/step-04/compare-talk-offer-412.png), [text comparison](../ui-lab/design/step-04/compare-talk-text-412.png). A [125% text stress study](../ui-lab/design/step-04/talk-enlarged-text-study.png) kept Talk’s greeting and voice controls separate at 360; this is a browser text-size experiment, not Android system-font validation. [Recorded geometry checks](../ui-lab/design/step-04/browser-review.json) cover the comparison states. Individual main-screen PNGs are exported beside the overview.

[Computed contrast](../ui-lab/design/step-04/contrast.json): ink/canvas 10.54–12.21:1, muted/canvas 5.27–5.36:1, muted/soft sections 4.66–4.76:1, action labels 7.49–7.95:1, error/canvas 5.83–5.92:1. A’s muted text was darkened after checking its preferred section. Decorative pale rules are not control boundaries. Disabled controls are not included in the normal-text threshold claim. Candidate type and target sizes are specified in logical units; preview scaling is not a native transform.

No lint suite, app build, or native-device check was run. System text scaling, actual keyboard/back behavior, screen-reader behavior, font registration, and runtime performance need selected-direction native review. Step 05’s five-gate design critique is now recorded separately; these screenshots do not claim native validation.

## Original selection prompt — answered in Step 05

Compare the three Talk screens first, then check whether your preferred direction still feels right for Activities and Journal. If you have a preference, give **A/B/C + one thing to borrow or remove**. No detailed testing is needed. No design will be locked until the selection step.
