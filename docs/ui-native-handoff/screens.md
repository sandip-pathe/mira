# Selected screens: native transfer specification

All measurements are unscaled logical units. Values in [design-tokens.json](design-tokens.json) describe the selected Lab; sizes that must flex for native safe areas or larger system text are anchors, not fixed screen coordinates. `selected.css` overrides the older A/B/C CSS. Do not use B/C selectors, the old control, or the visual-language board's miniature sample as native screen specifications.

## Shared shell

Header: 68-unit base area, 22 horizontal padding, 8 vertical padding; allow it to grow for accessibility. Talk uses the forest signature within the existing 92 × 42 image container; Activities and Journal use Nunito Sans, 30/35.1, weight 600. Help remains visible and functional in the appropriate native location. Keep actual native support actions rather than the Lab's placeholder Help dialog.

Tabs: flat top edge, surface background, line separator, three recognizable labels. Lab base height is 76 before native inset reconciliation. Active icon has a small soft-color backing; no curved bar or raised central tab. Icons: `microphone-outline`, `shape-outline`, `notebook-outline`; nominal icon size 24, labels 12 (500 inactive, 700 active). Use native safe-area accounting once, without double-padding the bottom. Preserve native routes and journal tab listeners.

Buttons: main action primary fill and `onPrimary` text, minimum 52 height, radius 16. Quiet actions use primary text and an unfilled/soft state. All touch areas are at least 48 × 48 even where the visible icon is smaller. Inputs show native focus/selection and correct keyboard behavior. Sheets use surface, 24 top radius, about 22 horizontal padding, scrollable content, and one dismissal owner. Reuse existing native modal/stack patterns; HTML dialogs are references only.

File owners: `mobile/src/app/_layout.tsx`, `mobile/src/app/(tabs)/_layout.tsx`, `mobile/src/components/ui/{tokens,ActionButton,HelpButton,Surface,StatusPill,Eyebrow}.tsx` (tokens is `.ts`). The shared components should consume the theme, without making every screen a bordered card.

## Talk

Reference: [welcome](../../ui-lab/design/step-06/talk-welcome.png), [reply](../../ui-lab/design/step-06/talk-reply.png), [text/offer](../../ui-lab/design/step-06/talk-text-offer.png). Live selected component: `ui-lab/src/selected/Talk.jsx`.

### Composition

Keep the order **header → centered state heading/helper → flexible hero region → voice controls → tabs**. Give the hero region the remaining space rather than pushing it against the mic. Keep header and controls stable while the mascot shrinks for an offer, keyboard, or short viewport. Let longer content scroll when needed; do not clip controls to preserve a decorative image.

| Element | Selected Lab anchor |
| --- | --- |
| Main content | 24 horizontal padding, 12 top, 24 bottom, 8 gap |
| Welcome heading/helper | 30/35.4 at 600; helper 16/23.2; centered, max width 320 |
| Ready heading | Existing 28-unit state override |
| Hero | 250 × 250 inside flexible region; proportional reduction when needed |
| Text / end side actions | 25-unit icons, 12-unit labels, vertical arrangement |
| Hold control | 92 diameter, 38-unit mic icon; 12 minimum gap to other controls |
| Hold instruction | 14-unit semibold, 14 gap below row |
| Activity offer present | Heading 22, helper 14, hero 150; keep one actual offered activity |
| Keyboard constraint | Existing Lab anchors: heading 24, hero 130, mic 72; adapt natively rather than hardcoding keyboard height |

### State mapping

| Native condition | Visual and copy |
| --- | --- |
| Fresh / ready | Original companion pose; welcome heading; mic off; optional 6-second 3-unit idle drift |
| Connecting / capture starting | Native connection/startup labels, visibly distinct from recording; no listening claim before capture starts |
| User actually holding and capturing | Listening pose; static mic ring; “I’m listening.” / “Let go to send.” |
| Turn submitted / waiting | Thinking pose; separate pending indicator; “One sec…”; native request timing |
| Reply audio actually playing | Speaking pose; subtle 2-second nod, 900ms level-mark variation; “Mira’s speaking” |
| Voice ended | Calm original pose; “Voice is off.” / “Hold the mic when you’re ready.” |
| Voice error / worker unavailable | Existing retry/text alternative, conversation retained; accurate failure label, original calm pose |
| Text mode | Native conversation, composer, retry, current context and offer; actual sent messages and AI responses |

Bind these visuals to existing session/audio state. Never use the Lab's 850/2200ms simulated response timers, fake replies, or fixed One Small Step offer in the app. Native disconnect/fallback and music-return behavior remain functional. Release ends the turn; cancel, navigation, blur/background, and interruption are handled by the existing voice implementation. A visual animation never delays a press or changes turn semantics.

Art transform transition: 180ms; opacity 160ms. Listening lean about -2 translateY/-1 degree; reply nod up to 3 units/1 degree. Stop ambient loops off screen and in background; reduced motion uses still poses and the same status labels. Existing real audio visualization can remain where useful; do not label a fabricated waveform as microphone measurement.

### Mobile mapping

`features/talk/TalkScreen.tsx` owns arrangement; `components/TalkHeader.tsx` owns wordmark/Help; `PresenceHero.tsx` owns art/state presentation; `TalkCallControls.tsx` owns control presentation; `TalkTextPanel.tsx`, `TalkTextComposer.tsx`, `ConversationMessages.tsx`, `InterventionOffer.tsx`, and `ContextSources.tsx` inherit the same foundation. `TalkVoicePanel.tsx` and `UrgentHelpPanel.tsx` preserve their actual content/actions. Avoid editing `hooks/useTalkSession.ts` or provider contracts as part of visual transfer.

## Activities library

Reference: [fresh library](../../ui-lab/design/step-06/activities-fresh.png), [preferred first](../../ui-lab/design/step-06/activities-preferred.png), [saved work](../../ui-lab/design/step-06/activities-saved-actions.png). Lab: `ui-lab/src/selected/Activities.jsx`. Native owner: `features/actions/ActionsScreen.tsx`.

- Standard Activities header, then “What sounds doable right now?” with the small note/pebble/sprout motif. Intro 25/30 at 600; motif 122 square; do not crowd or overlap the words on narrow screens.
- Scroll content uses 22 horizontal padding. Categories remain Express, Move forward, Take a break, Follow a guide. Group heading 20/25 at 600.
- Open rows with a fine bottom separator: nominal minimum 80 high, 12 vertical padding and 12 gap. Activity name 17/22.1 at 600; summary 14/19.6. Icon 24 inside a 28-wide slot; trailing `arrow-top-right` 19.
- Activities promoted by the existing explicit reuse-preference ranking appear under “Your picks” at the top, once only. Keep the existing preference algorithm/data; visual sorting does not add a recommendation service. Lab preferred rows use 68 minimum height and omit the leading icon.
- Keep existing continuation and saved-output access, meaningful empty/error states, and native deletion/return behavior. Saved letters remain inside Unsent Letter. Journal stays in Express and opens its recent-entry home. Never wait for a server to make the bundled catalog visible.
- Use the icon map in the token file; canonical activity IDs come from the app. Real catalog titles/descriptions remain the content source. No fixture record is copied into native state.

This locks the library composition, not the individual activity screens or the Lab's framed legacy activity pages.

## Journal editor and supporting home/read views

Reference: [blank](../../ui-lab/design/step-06/journal-blank.png), [writing/keyboard](../../ui-lab/design/step-06/journal-writing-keyboard.png), [prompt sheet](../../ui-lab/design/step-06/journal-prompts.png), [home](../../ui-lab/design/step-06/journal-home.png). Lab: `ui-lab/src/selected/Journal.jsx`.

### Composition

Editor is an open writing page. Blank state uses “Start wherever you want.”, a small notebook motif, optional prompt row, writing field, page-style icon, hold-to-record mic, and one Save action. The writing tools stay fixed above the keyboard while the page content scrolls. Newlines divide text into separate entries with a fine rule between them; Backspace removes a newline. The timeline contains only the user's text entries and playable local voice capsules. Do not wrap the whole page inside another panel.

| Element | Selected Lab anchor |
| --- | --- |
| Editor | 22 horizontal padding, 8 top, 18 bottom; selected override gap 12 |
| Invitation | 26/31.2 at 600; notebook 104 square |
| Prompt | 17/23.8 at 600; picker text/icon 14/18 |
| Writing | Default 17, line-height ratio 1.65; existing native adjustable 14–26 range; ink always `#111111` |
| Tools | 14 text, 21 icons; quiet, separated by a fine line |
| Save row | 14 text; primary save and secondary finish; base 52 minimum, 48 in cramped keyboard layout |
| Home | Notebook 135 square; invitation 28/33.6; New entry button and recent sessions list |
| Recent entry row | 16 title, 14 metadata; open separators |

Use the actual native keyboard and focus behavior. A color/prompt sheet has one owner; do not mount a duplicate picker. The Journal page-color choice is independent of app theme. Keep writing and page-specific controls readable on the chosen paper in all three app themes. Home uses app colors, not the editor's selected page color.

### Navigation and state contracts

| Action / state | Preserve |
| --- | --- |
| Journal tab | Fresh entry via `/you/new` → `/you/entry` |
| Activities → Journal | `/you` recent-entry home |
| Home → New entry | Start session, then `/you/entry` |
| Recent session | Open actual local record in existing draft or finalized/read presentation |
| Save | Finalize the session locally and return to the prior screen |
| Local save failure | Preserve unsaved writing and offer the existing retry |
| Hold mic | Begin local audio capture on press-in; save the capsule on release |
| Voice note / excerpt / feedback | Existing native recording, playback, delete, review/approval and reuse behavior |

Native owners: `JournalEntryScreen.tsx`, `JournalHomeScreen.tsx`, `components/journalStyles.ts`, `JournalPickers.tsx`, `MemorySections.tsx`, `FeedbackSection.tsx`, plus routes under `app/(tabs)/you/`. Keep `JournalProvider` and storage semantics intact. Use the currently working native flows wherever the browser mock differs.

## Remaining surfaces inherit the foundation

All nine experience screens, the four existing saved-output routes, activity preference/excerpt components, Talk support/context/offer panels, and Journal pickers/feedback/read views inherit the theme, Nunito typography, button/icon treatment, and illustration color roles. Their inventory and order are in the transition plan. They do not inherit Talk's mascot position or Journal's paper layout.

For vector activity illustrations, replace arbitrary brand colors with semantic art roles while keeping meaning and contrast. For the approved clay PNGs retain their original olive, cream, and peach material colors; do not tint the full image. New large compositions and new animation choreography remain individual activity design work.
