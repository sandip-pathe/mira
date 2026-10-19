> **Superseded proposal (2026-10-19):** This independent plan conflicts with the selected [Nine Activities Master Blueprint](../PRD/Mira_Nine_Activities_Master_Blueprint_v2.1.md), revision 2.2, on activity IDs, scripts, retention, and scope. Do not execute it. Use the blueprint and [activity build ledger](../PRD/mira_activity_build_status.md); the content below remains historical design context only.

# Mira activity experience: independent implementation plan

**Status:** Implementation blueprint and engineering review  
**Date:** 2026-10-17  
**Scope:** Replace the current activity catalog with nine post-event reflection and follow-through activities. This plan is independent of the product PRD.

## Product shape

Mira supports people after an event, while ruminating, feeling rejected, stuck on a task, or unsure what to do next. Talk remains the place to explain the moment. It may offer one activity, with permission. Activities also remain directly accessible in the existing Activities tab. Every run can be skipped, paused where applicable, stopped, or returned from to Talk.

### Catalog

| Canonical ID | Title | Pattern |
|---|---|---|
| `brain_dump` | Brain Dump | Capture, optionally sort |
| `task_reset_60s` | Tiny Next Step / Task Reset | Capture, sort, choose |
| `name_a_feeling` | Notice & Name | Prompt and optional text |
| `write_100_words` | Write 100 Words to Them | Focused letter editor |
| `reach_out` | Reach Out | Prepare editable message |
| `short_movement` | Short Walk / Room Change | Choose and try |
| `one_song_reset` | One Song Reset | Choose and take a break |
| `unsent_message` | Unsent Message | Free letter editor |
| `perspective_shift` | Perspective Shift | Structured reflection |

Keep the 100-word activity and Unsent Message distinct in framing, but store both through one letter archive. The 100-word target is optional and never blocks saving. Do not include Grounding or paced breathing in the core nine.

## Main journeys

### Talk to activity

1. User talks or types about what happened or what feels stuck.
2. Mira listens or asks one useful question. It may offer one activity with a short reason and a clear decline choice.
3. On acceptance, open the activity introduction with title, purpose, effort, and Start / Back to Talk.
4. Guide one step at a time. Keep local input editable and exits visible.
5. Offer an optional outcome check, then return to the same Talk context.

### Activity list

Use the existing Activities tab. Group by intent: **Get thoughts out** (Brain Dump, letters), **Find a next move** (Task Reset, Reach Out), and **Shift the moment** (Notice & Name, Perspective Shift, Walk / Room Change, One Song Reset). Cards show title, one-line promise-free description, and a small visual mark. Do not add urgency rankings, progress streaks, or clinical categories.

### Letter archive and editor

The letter activity landing view offers **Write a new letter** and **Saved letters**. Saved letters are deliberately retained on this device, never saved from typing alone. Each archive row shows title, optional recipient, and date, but no letter-body preview. Open, edit, rename, and delete are available. Delete requires confirmation.

The editor has optional recipient and title fields, a large multiline writing area, optional prompt chips, a word count for the 100-word prompt, and Save / Finish / Discard. Save confirms that the letter is stored privately on this device. Drafts remain in memory until explicitly saved; failed writes preserve the editor contents and expose Retry. Letters are separate from Journal, Talk context, and future-use preferences. Demo reset clears them.

## Activity flows

- **Brain Dump:** temporary multiline capture; no persistence; choose one topic to discuss or stop. (Task Reset separately offers optional AI-assisted sorting with disclosure and manual fallback.)
- **Tiny Next Step / Task Reset:** capture competing tasks; optional editable sorting; choose one item; define a user-chosen smallest action; try, defer, or stop. No reminders.
- **Notice & Name:** invite a word or sentence in the user’s language; allow “something else,” skip, or no label. No mood scoring or inference.
- **Write 100 Words to Them:** optional guided prompts, flexible editor, optional 100-word target, explicit save to archive.
- **Reach Out:** choose whether to contact someone; draft/edit only; user chooses if and how to send. Mira never sends.
- **Short Walk / Room Change:** choose walk, comfortable movement, change rooms, or skip; optional foreground timer; no movement requirement.
- **One Song Reset:** user chooses a song outside Mira; optional timer and return control. No playback integration.
- **Unsent Message:** open-ended editor to a chosen person or no recipient; save only by explicit choice.
- **Perspective Shift:** distinguish known facts from guesses; generate user-authored possible interpretations; do not state another person’s motives as fact; user may reject the exercise.

## Visual design and motion

Stay within the installed palette, Poppins typography, and shared Surface/ActionButton system. Use warm paper-like letter surfaces, restrained ruled lines, and small abstract activity marks built from existing vector icons or native shapes. Avoid stock photography and clinical visual metaphors.

Each Do screen uses a consistent header, one focused prompt, a clear input/action, and a compact progress cue. One primary action per step; secondary Skip / Pause / Back controls stay easy to reach above the keyboard. Use short opacity/translation transitions between steps, with a still state when reduced motion is enabled. State is communicated by text and shape as well as color.

## Engineering review

### Data and ownership

- FastAPI catalog remains canonical for activity IDs, copy, selection, and eligibility. Add validated presentation types for letter and reflection patterns; do not create a general workflow interpreter.
- Mobile owns transient drafts, step state, timer state, and local archive rendering.
- Add a versioned, bounded local letter store with UUIDs, timestamps, title, recipient, and body. Use atomic replacement where supported; parse defensively; keep text out of logs. Reset must clear the archive.
- Preserve legacy Continue IDs as a compatibility concern. Do not silently show old saved Brain Dumps or messages as letters; migrate only non-sensitive next-step items, or leave legacy items removable if their former activity is retired.
- Keep activity feedback and preference persistence on existing consented server paths. Letter bodies never enter those requests.

### Risks and safeguards

1. **Sensitive retention:** archive adds durable personal writing. Make save explicit, offer deletion, communicate that Mira does not send it, clear on reset, and do not add app-level sync. The current file store is not encrypted and operating-system backups may include app documents; do not describe it as encrypted or device-exclusive. Choose protected storage before using this for highly sensitive or public-facing data.
2. **Content processing:** the current Task Reset sorter sends the selected task lines to Mira’s AI provider for one-time grouping. Disclose that before the action and keep manual sorting available.
3. **Catalog migration:** saved Continue entries may reference retired IDs. Preserve non-sensitive entries or explain that the old activity is unavailable; never map a raw dump into a letter archive.
4. **Workflow branching:** avoid an activity-specific maze in the runner. Use a small set of typed reusable panels, with the two letter activities sharing one editor.
5. **Keyboard and small screens:** keep the editor scrollable, support keyboard dismissal, ensure Save remains reachable, and avoid nested scrolling.
6. **Offline behavior:** render canonical content already loaded by Actions/Talk. Letter save remains local; activity start/feedback retains existing server failure messaging.
7. **Perspective safety:** prompts invite possibilities and maintain uncertainty; avoid model-generated claims about absent people.
8. **Accessibility:** descriptive labels, live step announcements, 48dp controls, non-color state, and reduced-motion behavior.

## Build sequence

1. Replace the active catalog and align type contracts while retaining safe legacy storage behavior.
2. Update Activities grouping and add the private saved-letter list.
3. Add shared letter store and editor, including create/open/edit/save/retry/delete/reset.
4. Implement the remaining activity-specific inputs using typed reusable panels.
5. Add restrained transitions and empty/loading/offline/error states.
6. Perform a focused review of the catalog contract, migration paths, letter retention/deletion, and one Android walkthrough.

## Completion criteria

- Exactly these nine IDs are offered from the active catalog and displayed in the Activities screen.
- Each activity has a complete usable flow, editable input where needed, and clear exits.
- Letters appear in Saved Letters only after explicit save; retry does not lose text; delete and demo reset remove them.
- Letter bodies never enter Talk, Journal, activity feedback, or server preference storage.
- No activity implies clinical efficacy or claims to know another person’s thoughts.
- The existing Talk session and activity feedback flow remain usable.
