# Step 02 — References and friction evidence

Completed: 2026-10-20. Scope: Talk, Activities, and Journal. This is reference harvesting and review research; Step 03 deconstruction/synthesis and visual design have not started.

**Open the [reference board](http://localhost:5173/design/step-02/reference-board.html)** while the UI Lab is running. It contains reference strips, original frames, two animated examples, and the searchable 170-review corpus. The [local HTML](../ui-lab/design/step-02/reference-board.html) and [source manifest](../ui-lab/design/step-02/reference-manifest.json) are also saved in the project.

## Three-donor coverage

Each surface has an emotional-pacing donor, a familiar consumer-interaction donor, and a tactile/game-feel donor. References overlap deliberately; the contribution of each is different. The material is for studying composition and behavior, not importing competitor artwork into Mira.

| Mira surface | Emotional pacing | Consumer familiarity | Tactile/game feel |
| --- | --- | --- | --- |
| Talk | Finch: companion-led entry and one focused prompt | Google Keep: explicit voice-capture state followed by a visible result; WhatsApp's documented waveform/preview controls supplement this | Duolingo: immediate selected/enabled/confirmed states and a character reacting to the action |
| Activities | Finch: illustrated hub → category → focused activity | Google Keep: collection → capture → resulting note back in the collection; study separation of browsing and doing | Duolingo: recognizable action shapes and state changes; keep control placement readable as content changes |
| Journal | Finch: optional reflection selection → uncluttered writing → clear completion | Day One Android: keyboard-visible editor and contextual tool/picker states | Duolingo: localized acknowledgment without making the person wait through a full-screen interruption |

These are donor roles and observations, not a final layout recommendation. How We Feel supplies an additional reference for coherent shape/color language, with its store-imagery limitations stated below.

## Captured material

| Set | Frames | Evidence and source | Useful observation |
| --- | --- | --- | --- |
| [Finch reflection strip](../ui-lab/design/step-02/references/finch-reflection/strip.jpg) | 5 | Actual iOS flow screenshots published by [Revyl Atlas](https://revyl.com/atlas/finch/); capture date/build unknown | Color and illustration can lead into a quiet writing surface; prompt, input, and save reward are visually distinct |
| [Google Keep voice strip](../ui-lab/design/step-02/references/keep-voice/strip.jpg) | 6 | Keyframes and original GIF from [Google's 2017 capture tips](https://blog.google/products-and-platforms/products/workspace/8-tips-help-you-keep-google-keep/) | Capture has an explicit active state; the output becomes visible in the note collection |
| [Day One editor strip](../ui-lab/design/step-02/references/dayone-editor/strip.jpg) | 5 | Official [Android editing guide](https://dayoneapp.com/guides/day-one-for-android/editing-and-formatting-entries-in-day-one-for-android/); image paths dated July 2026 | Toolbars can respond to editing context; tools and the keyboard share space; the heading chooser is a separate branch |
| [Duolingo feedback strip](../ui-lab/design/step-02/references/duolingo-feedback/strip.jpg) | 6 | Keyframes and original GIF from [Duolingo's character-design article](https://blog.duolingo.com/building-character/), published in 2021 | Selection enables an action, confirmation changes the local feedback area, and the character reacts within a consistent visual world |
| [Duolingo input-state strip](../ui-lab/design/step-02/references/duolingo-states/strip.jpg) | 5 | Related iOS screenshots from [Revyl Atlas](https://revyl.com/atlas/duolingo/); date/build unknown | Listening and speaking have visibly different controls and alternatives; these are related states, not one continuous recording |
| [How We Feel store strip](../ui-lab/design/step-02/references/howwefeel-store/strip.jpg) | 5 | Developer-supplied [Android store imagery](https://play.google.com/store/apps/details?id=org.howwefeel.moodmeter&hl=en&gl=IN), retrieved now | Shape/color language carries across selection, saved entries, and content; images include historical dates and do not establish the latest flow |
| [WhatsApp voice graphics](../ui-lab/design/step-02/references/whatsapp-features/strip.jpg) | 2 | Official [March 2022 announcement](https://about.fb.com/news/2022/03/new-voice-message-features-on-whatsapp/) | Waveform and draft-state feedback have distinct roles; these are feature diagrams, not a complete voice-recording flow |

Total: **34 frames**, including **22 frames across four primary sets** with 4–6 frames each. The other three sets are supplementary. Two original animated GIFs are retained, with keyframe timestamps in the manifest. The Keep strip crops the phone for readability; original full frames remain linked.

Source checking caught one mismatch: Atlas labels `lesson-complete.png` as completion, but the actual image shows a return to the learning path. The board labels it by what is visible; it is not used as evidence for a completion receipt.

The official [Day One creation guide](https://dayoneapp.com/guides/getting-started-with-day-one/creating-entries/) additionally distinguishes platform save behavior and documents direct Android new-entry access. It supports studying a fast writing entry point; its persistence rules are not substituted for Mira's.

## Review corpus and method

Fetched **498 distinct 2-star/3-star records** from the public Google Play review endpoint using `google-play-scraper`, English language and India store request, newest within each rating. Exact normalized text was deduplicated within each app. Display names, profile images, and developer replies were not needed for the analysis.

For the focused screen, selected the newest 45 eligible records per app where available, or all eligible records for the smaller How We Feel pool. Eligibility: posted on/after 2025-10-20 and at least 18 whitespace-separated words. This produced **214 screened records**. Read and manually coded those records; **44 were excluded**, leaving **170** relevant reviews. Exclusions cover price-only complaints, unrelated feature requests, advertising-art opinions, and reports too vague to support a screen implication.

| App | Retained reviews |
| --- | ---: |
| Finch | 38 |
| Headspace | 40 |
| Daylio | 27 |
| Day One | 34 |
| How We Feel | 31 |
| **Total** | **170** |

Ratings: **81 two-star**, **89 three-star**. Dates: **2025-11-07 through 2026-10-19**. This meets the playbook's 150–200 target. The age/length filter and newest-first selection favor detailed recent complaints and can overrepresent a bad app release; repeated Finch crash reports are one visible example. An English/India request does not establish a reviewer's age, nationality, language, device, or living situation. Three non-English records were retained with first-pass language interpretation noted.

The themes are manually assigned, overlapping labels. Counts describe this purposive corpus, not the prevalence of problems among all users. Reviewer claims and causes are not independently reproduced or established as fact.

| Theme | Reviews | Meaning |
| --- | ---: | --- |
| Reliability | 71 | Lag, crashes, interrupted media, failed operations, or lost work |
| Agency | 64 | Lost/unwanted settings, restricted expression, imposed prompts, or unwanted feature promotion |
| Navigation | 56 | Crowding, rearranged/buried actions, interrupted tasks, or difficulty resuming |
| Editing/readability | 30 | Text selection, keyboard visibility, text size, gesture precision, or repeated input |
| Expectation/access | 26 | Misleading action/access expectations, inaccessible routes, or broken help affordances |
| Tone/pressure | 21 | Infantilizing presentation or pressure from streaks, rewards, tasks, and affirmations |

Audit files: [coded corpus with source links](../ui-lab/design/step-02/reviews-coded.json), [screening decisions including exclusions](../ui-lab/design/step-02/screening-decisions.json), [214 screened records](../ui-lab/design/step-02/review-screening.json), [498-record fetched pool](../ui-lab/design/step-02/reviews-candidates.json), and [counts](../ui-lab/design/step-02/review-stats.json). Review IDs below open the corresponding record on the board; every record contains its Google Play URL and retrieval time.

## Five recurring frictions relevant to Mira

1. **Returning to something becomes harder than starting something new.** Headspace reviewers describe buried recent/favorite content and changed navigation; How We Feel reviewers describe check-ins displaced by educational content. Examples: [R048](http://localhost:5173/design/step-02/reference-board.html#R048), [R061](http://localhost:5173/design/step-02/reference-board.html#R061), [R079](http://localhost:5173/design/step-02/reference-board.html#R079), [R190](http://localhost:5173/design/step-02/reference-board.html#R190). Mira implication to carry into synthesis: make starting an activity and returning to chosen work recognizable without letting secondary sections bury both.
2. **Prompts and feature promotion interrupt the person's own intent.** Reviews mention repeat-dismissed popups, forced affirmation choices, and AI controls that keep demanding attention. Examples: [R017](http://localhost:5173/design/step-02/reference-board.html#R017), [R112](http://localhost:5173/design/step-02/reference-board.html#R112), [R149](http://localhost:5173/design/step-02/reference-board.html#R149), [R160](http://localhost:5173/design/step-02/reference-board.html#R160). Mira implication: useful AI can be central to Talk and available in Journal while optional prompts and assistance respect the current task and dismissal.
3. **Small editing problems make writing feel like work.** Day One reviewers describe text hidden by the keyboard, extra formatting taps, changing text presentation, difficult selection, and right-to-left input problems. Examples: [R142](http://localhost:5173/design/step-02/reference-board.html#R142), [R153](http://localhost:5173/design/step-02/reference-board.html#R153), [R154](http://localhost:5173/design/step-02/reference-board.html#R154), [R156](http://localhost:5173/design/step-02/reference-board.html#R156). Mira implication: give the writing/caret priority; retain readable sizing and stable dark text; tools must be accessible without repeatedly interrupting writing.
4. **An unclear or unreliable result breaks the interaction's value.** Examples include apparently saved entries disappearing, blank completion screens, stopped recordings, and local content requiring a connection. Examples: [R099](http://localhost:5173/design/step-02/reference-board.html#R099), [R140](http://localhost:5173/design/step-02/reference-board.html#R140), [R175](http://localhost:5173/design/step-02/reference-board.html#R175), [R084](http://localhost:5173/design/step-02/reference-board.html#R084). Mira implication: capture, processing, local save, and AI follow-up need separate truthful states. A new visual design should support recovery; it cannot fix the reported competitor defects by itself.
5. **Supportive presentation can become childish, judging, or compulsory.** A Finch reviewer found the presentation aimed too young; others describe positivity pressure or involuntary personalization changes. Daylio reviews criticize streak and achievement pressure. Examples: [R004](http://localhost:5173/design/step-02/reference-board.html#R004), [R026](http://localhost:5173/design/step-02/reference-board.html#R026), [R095](http://localhost:5173/design/step-02/reference-board.html#R095), [R127](http://localhost:5173/design/step-02/reference-board.html#R127). Mira implication: keep playful art and satisfying feedback, but write like a peer and respond to the person's action without grading their mood or attendance.

This ordering reflects relevance to the three-screen task, not a statistical severity ranking. Reviews that ask for more expression, improved AI responses, or preserved audio are also important counter-evidence: [R201](http://localhost:5173/design/step-02/reference-board.html#R201), [R204](http://localhost:5173/design/step-02/reference-board.html#R204), and [R197](http://localhost:5173/design/step-02/reference-board.html#R197). The evidence does not justify cutting AI, illustrations, sound, or personalization wholesale.

## Anti-pattern rulebook for Step 03

These are research-derived criteria to test against the design candidates, not a selected visual system.

| Avoid | Mira design criterion | Evidence |
| --- | --- | --- |
| Opening a page full of competing chores | Make the screen's main purpose/action evident; let supporting tools and existing saved work keep their own hierarchy | R046, R053, R087, R178 |
| Hiding favorites or recent work after a redesign | Preferred activities remain discoverable; returning to kept work and Journal drafts has a clear route | R048, R079, R159, R190 |
| Repeatedly reopening dismissed assistance | Optional prompts/assistance respect dismissal and preserve the active writing/conversation | R017, R101, R149, R160 |
| Letting animation delay the next useful action | Use expressive motion for state, character, and transitions; keep input/control response immediate and interruptible | R154, R186; Duolingo's localized feedback example |
| Moving/tinting writing or obscuring it with the keyboard | Stable readable text, visible caret/input, reachable save, and context-appropriate tools | R142, R153, R154, R156 |
| Treating tap, recording, processing, and success as the same visual event | Design clear capture, pending, result, retry, and saved states; AI follow-up failure does not undo a local-save confirmation | R055, R099, R140, R175; Keep/WhatsApp/Day One references |
| Making celebration a judgment or an extra task | Acknowledge an action without streak guilt, mandatory reward rituals, or pressure to feel better | R004, R026, R095, R109, R127 |
| Making text a second-class fallback or removing audio for everyone | Preserve text use without speech and clear optional voice/audio states; no requirement to speak to navigate | R006, R069, R197; Duolingo input alternatives |
| Implying unavailable capabilities or misleading help | Use current catalog/capability facts; controls explain the action they actually perform | R037, R085, R097, R113; Step 01 copy mismatch |

## Copy and environmental evidence

The evidence supports concise, direct, user-controlled language. It does not prove that a particular slang term, Hinglish style, font, or palette works for Indian Gen Z. R116 describes comprehension problems; R201 asks for more casual AI responses; neither establishes a universal voice. Keep peer-like candidate copy grounded in the user's stated direction, then compare it with actual screen content in Step 03.

Shared-room concern has limited direct support in this sample: R005 objects to unexpected discoverability and R159 describes concern about relatives reading writing. Brightness, audio interruption, and unwanted screen behavior appear in R069, R118, and R197. These support examining discretion and mode control. They do not establish the playbook's broad cultural claims or justify a forced dark/music-player disguise.

## Access gaps and limits

- Page Flows returned HTTP 403 during access. Public Atlas captures and official material provided the four primary reference sets instead. Mobbin/Appshots were not required to obtain those sets.
- There are no newly recorded live donor-app sessions or device audio/haptic traces. Two official historical GIFs provide motion samples. Their encoded timelines are not native frame-rate, latency, spring, or haptic measurements.
- Finch/Duolingo Atlas captures are iOS and have no verified current build/date. Borrowing Android interaction details from them would require later native adaptation.
- WhatsApp supplied two official static diagrams here, not a 4–6-frame flow. How We Feel supplied store panels, not current flow captures. Both remain supplementary; neither fills a missing primary flow slot.
- No participant demographics or roommate/noise tests were collected. Such claims remain hypotheses until observed. Review reports are not a clinical or causal evaluation.

## Handoff and status

Step 02 is complete: three-donor coverage, four primary reference sets, supplementary material, source manifest, a target-sized recent review corpus, coding/exclusion audit, and the friction rulebook are saved. Step 03 will deconstruct these sources into the five layers and synthesize layouts/copy. No palette, font, illustration direction, new flow, or native dependency has been locked by this research. The UI and app code are unchanged.
