# Mira — Nine Activities Master Blueprint and Codex Build Orders

**Document Type:** End-to-End Product, UX, Copy, Visual & Architectural Blueprint  
**Version:** 2.2 — corrected blueprint plus sequential Codex handoff  
**Date:** 19 October 2026  
**Scope:** Complete feature design, screen-by-screen flows, proposed product copy, visual asset briefs, state/audio rules, legacy migration, and QA acceptance criteria (Zero application code).

---

**Status:** Implementation-ready planning target; no app code has been changed here. Proposed scripts, emotion definitions, and pacing choices have not been represented as clinically reviewed or usability-tested.

**How to use:** Attach this file in the Mira repository's Codex session. Execute one work order from Section 10 at a time using Section 9's reusable instruction. Each work order ends with a working, reviewable result and a factual status report. Routine implementation choices are already authorized within that selected work order; no approval loop is required for every small edit.

**Document authority:** This revised activity catalog and its clarified UX are the requested demo target. Preserve existing Talk, Journal, privacy, Help, and voice contracts except for the explicit activity extensions specified here. Align stale repository documents during Work Order 00. Read applicable repository instructions; verify actual paths/dependencies before changing code. Existing working user changes must be preserved. This document does not authorize publishing, external messaging, accounts, trackers, or unrelated product work.

**Stages are not mandatory screens:** The numbered screens below describe states of the experience. Combine related setup into one canvas or drawer when useful; never add navigation just to match a stage count. In particular, letter addressing sits above its editor and breathing settings stay collapsed on its main canvas.

## 1. Core Product Strategy

### 1.1 Design Objective
A user must be able to understand an activity card at a glance, try the experience, leave with a concrete artifact or bounded reset, and exit without ever feeling trapped in an app. Visuals must demonstrate what to do and reflect the user's input—nine copies of a generic `Next / Done` form are strictly rejected.

### 1.2 The Four Strategic Pillars
*   **High Agency, Zero Diagnosis:** Mira does not assume people only open the app during an acute crisis, nor does it use hidden sentiment scoring to reorder the UI. Activities are organized into static editorial groups for predictable browsing.
*   **Match the Input to the Task (Mira adaptation inspired by Wysa):** `Talk` is for open voice/text conversation; `Actions` are structured, tactile experiences (counters, pacing shapes, task slips, feeling chips, letter stationery, and real-world breaks) that do not turn every tap into another chatbot question.
*   **The Explicit Excerpt Bridge (Mira adaptation inspired by Sonia):** Raw writing inside expressive activities stays in temporary application state and is cleared on final exit/discard. Temporary backgrounding and switching between edit/read views do not clear the live draft. No secure memory-erasure guarantee is made. If a user wants to discuss something they wrote, they explicitly select an excerpt, preview the exact text, and hand it off to `Talk` via a one-time transfer token.
*   **Honest Hardware Boundaries:** Mira never pretends to sense the physical environment or verify off-screen behavior. Counters record *user acknowledgements* (not room scans), breathing tracks *guide cycles* (not respiratory rate), movement tracks *elapsed time since starting* (not steps or GPS), and music handoffs never show fake waveforms or auto-complete timers.

---

## 2. The 9-Slot Catalog & Competitive Synthesis

### 2.1 Master Catalog Promise & Editorial Metadata

| Slot | Canonical ID | Display Name | Static Group | Card Promise | Editorial Duration Label | Main Interaction | Tangible User Output |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `grounding` | **Grounding** | Follow a guide | Notice what is around you | *A few minutes* | Sensory cards with self-reported tap counters | A completed or partial noticing sequence (no score) |
| **2** | `paced_breathing` | **Paced Breathing** | Follow a guide | Follow a comfortable rhythm | *Your pace* | Animated single-shape pacing with adjustable tempo | A bounded breathing round (no claimed emotional state) |
| **3** | `brain_dump` | **Brain Dump** | Express | Get it out. Keep it messy. | *As long as you need* | Editable voice-chunk & text canvas + prompt drawer | Thoughts in their own words + optional `Talk` excerpt |
| **4** | `one_small_step` | **One Small Step** | Move forward | Make one thing easier to start | *A few minutes* | Dual-entry task slips, bucket sort, & shrink step | One concrete **Next Action Card** (optionally kept) |
| **5** | `name_a_feeling` | **Notice & Name** | Express | Find words for this moment | *A minute or two* | Feeling chips + definitions + optional thought check | A user-owned feeling phrase + optional thought card |
| **6** | `unsent_letter` | **Unsent Letter** | Express | Write what you wish you could say | *At your pace* | Addressed stationery canvas + prompt drawer + read view | An unsent letter with clean closure/discard |
| **7** | `reach_out` | **Reach Out** | Move forward | Find the words to ask someone | *A few minutes* | Intent picker + editable starter draft + clipboard copy | A practical message copied to clipboard or saved |
| **8** | `short_movement` | **Move / Change Your Scene** | Take a break | Take a small break where you are | *Short break* | Accessible offline choice + still away-state screen | A self-reported real-world break |
| **9** | `one_song_break` | **One Song Break** | Take a break | Give yourself one song | *One song* | External music app handoff or allowlisted link + away state | A bounded listening break outside Mira |

### 2.2 Reference Apps and Mira Adaptations

| Reference App | Proposed Mira adaptation inspired by the app | Outside Mira demo scope (not an allegation about that app) |
| :--- | :--- | :--- |
| **Sonia** | Explicit, previewed handoff of a selected *Brain Dump* or *Unsent Letter* excerpt into `Talk`, plus returning with an approved *One Small Step* action card. | Silent AI summaries, broad cross-session memory harvesting, weekly reports, or follow-up push notifications. |
| **Wysa** | Matching tactile UI controls to the specific skill after conversation (task slips for planning, message cards for reaching out). | Turning every exercise step into a chatbot Q&A, or implying human clinical oversight/escalation. |
| **Clarity** | The optional, deterministic **Check this thought** branch inside *Notice & Name* separating situation from interpretation. | Automated "cognitive distortion" labels, clinical screening scores, forced positive reframing, or mood charts. |
| **How We Feel** | Plain-language emotion definitions and 2–3 nearby sibling words accessible via an explicit info button in *Notice & Name*. | Long-press-only hidden gestures, mood history tracking, Apple/Google Health syncing, or social sharing. |
| **Headspace** | Using a single calm expanding shape as the breathing instruction and clear sense illustrations in *Grounding*. | Competing background animations, borrowed characters, or claiming long-form meditation efficacy for a short demo. |
| **Finch** | Approachable small-action framing, visible skip/exit paths on every screen, and zero guilt when returning early. | Virtual pet economies, streaks, currency/stores, or relationship guilt mechanics. |
| **Stoic** | A collapsible **"Need a starting line?"** prompt drawer in *Brain Dump* and *Unsent Letter* that closes after selection. | Mandatory multi-box journaling templates, daily streak reminders, or automatic long-term retention of Mira activity drafts. |

---

## 3. Shared Visual System, Layout Anatomy & Universal Shell

### 3.1 Color Tokens & Spatial Ergonomics
*   **Color Palette (Cream & Forest-Green Family):**
    *   `Canvas Background`: `#F6F3EC` (Warm cream)
    *   `Elevated Card / Surface`: `#FFFEFB` (Crisp warm paper)
    *   `Primary Text / Ink`: `#242B25` (Deep charcoal-green)
    *   `Secondary Text / Metadata`: `#536257` (Muted sage)
    *   `Primary Action / Accent`: `#3F6852` (Forest green)
*   **Dimensions & Typography:**
    *   **Horizontal Page Padding:** `20 dp`
    *   **Vertical Rhythm:** `16 dp` between related blocks; `24–32 dp` between distinct sections
    *   **Type Scale:** `26–30 sp` for screen headings; `16 sp` minimum for body copy
    *   **Touch Targets:** `48 dp × 48 dp` minimum across all interactive chips, counters, and buttons
    *   **Intro Illustration Container:** `150–200 dp` height on standard screens; dynamically shrinks or scrolls when OS large fonts are active so the sticky primary button never obscures text.

### 3.2 Motion & Accessibility Contract
*   **Tactile Micro-Transitions:** Counter fills and chip selections animate over `150–200 ms` using native-driver opacity and scale transforms.
*   **Scene Transitions:** Step-to-step screen transitions run over `200–300 ms`. Editor text never animates character-by-character.
*   **Domain Truth Separation:** State machines and timers never depend on animation completion callbacks.
*   **Reduced Motion (`AccessibilityInfo`):** When the OS reduced-motion setting is enabled, scaling shapes and folding transitions are disabled automatically, falling back to static visuals and high-contrast text phase labels.
*   **No Gamification Spectacles:** Zero confetti bursts, streak counters, points, or fire/shredding particle shaders.

### 3.3 The `Actions` Hub Layout
1.  **Conditional `Continue` Shelf (Top of Scroll):** Appears above the catalog **only** when a user has explicitly saved an item from *One Small Step*, *Reach Out*, or *Move / Change Your Scene*. Shows the exact retained text, origin activity label, **Open**, and **Remove**.
2.  **Editorial Hero Card:** The first activity uses a larger featured card layout selected by a fixed editorial rule—never dynamically altered by inferred user distress.
3.  **Four Static Groups:** **Express**, **Move forward**, **Take a break**, and **Follow a guide**. Cards stack in full-width rows with dedicated illustration areas (optional 2-column grid only where readable, collapsing to 1-column on large fonts; zero horizontal carousels).

### 3.4 Universal Entry, Exit & Hardware Back Matrix

| User Context / Trigger | Origin: `actions_library` / `actions_continue` | Origin: `talk` (Accepted In-Chat Offer) |
| :--- | :--- | :--- |
| **Initial Launch** | Library: opens **Intro** (illustration, purpose, Start, Back). Continue: opens the saved action/draft at its compatible resume stage after validating its ID/version; never silently restarts an empty exercise. | **Skips redundant Intro confirmation**; opens directly into Step 1 / Pacing Setup. |
| **Contextual Privacy Copy** | Shown inline right next to the relevant control (Mic notice at capture, Clipboard notice at Copy, exact saved text preview at Keep)—never a legal wall before Start. | Identical inline placement. |
| **Hardware Back on Intro / Empty State** | Exits immediately back to `Actions` without a confirmation modal. | Exits immediately back to `Talk` without a confirmation modal. |
| **Hardware Back on Timed Guide (`Breathing`)** | Immediately pauses the foreground clock/animation and opens Pause controls (**Resume** / **Leave**). | Same immediate pause behavior. |
| **Hardware Back with Unsaved Text** | Opens lightweight 2-button decision: **Keep editing** / **Discard and leave** (cancels active capture before disposal). | Same 2-button decision; discarding clears activity-owned text state and returns to `Talk`. |
| **Normal Finish Screen** | Primary button: **Back to Actions** + optional collapsible *"Did that help?"* (**Not really / A little / Quite a bit / Skip**). | Primary button: **Back to Talk** + optional **Bring this to Talk** excerpt handoff. |

---

## 4. Complete Screen-by-Screen UX Flows & Copy (All 9 Slots)

### Slot 1: Grounding (`GroundingExperience`)
*   **Core Experience:** Notice real things in the room using Mira as a calm tally counter rather than a hidden-object game or typing test.
*   **Screen 1 — Intro & Sequence Choice:**
    *   *Illustration:* Open window and desk.
    *   *Copy:* **"Grounding — Take a moment to notice what is around you."** Secondary: *"Follow at your pace. Skip any prompt."*
    *   *Sequence Toggle (Remembered for this run only):* **`Quick notice (3-2-1)`** *(Default: 3 see, 2 hear, 1 feel)* vs. **`Full 5-4-3-2-1`** *(Optional reviewed catalog variant)*.
    *   *CTA:* **Start**.
*   **Screen 2 — Sight (`See`):**
    *   *Visual:* Large eye/window illustration + **3 empty markers** (`○ ○ ○`).
    *   *Header:* **"Notice 3 things you can see."** Status label: `"0 of 3"`.
    *   *Controls:* Primary tap button **Noticed one** (fills 1 marker over `150–200 ms`); a quiet **Undo** action appears only after an acknowledgement. **Continue** becomes prominent at the target count. **Skip this sense** remains a secondary text action. No optional text field or acknowledge-all control in the first demo.
    *   *Clamping Rule:* Tapping the 3rd marker clamps the counter at `3 of 3` and **does not auto-advance**, leaving space to tap **Undo** before tapping **Continue**.
*   **Screen 3 — Sound (`Hear`):**
    *   *Visual:* Ear/soundwave illustration + **2 empty markers** (`○ ○`).
    *   *Header:* **"Notice 2 things you can hear."**
    *   *Controls:* Same counter controls + **Skip this sense** (or a reviewed non-auditory alternate prompt without implying hearing occurred; microphone is never activated).
*   **Screen 4 — Touch (`Feel`):**
    *   *Visual:* Hand resting on fabric illustration + **1 empty marker** (`○`).
    *   *Header:* **"Notice one comfortable point of contact, such as your feet or the chair."** (Never asks the user to touch unknown objects).
*   **Screen 5 — Finish:**
    *   *Output Card:* Factual summary of which prompts were noticed or skipped in this run (no numerical score and no *"Anxiety reduced"* claim).
    *   *CTAs:* **Back to Actions / Talk** and optional **Another prompt**.

---

### Slot 2: Paced Breathing (`BreathingExperience`)
*   **Core Experience:** A single visual shape following a comfortable rhythm, backed by a still/text alternative.
*   **Screen 1 — Intro & Setup:**
    *   *Illustration:* Expandable soft shape inside a fixed reference outline.
    *   *Copy:* **"Follow a comfortable rhythm, or breathe at your own pace."** Safety note: *"Breathe gently without forcing it. Stop anytime if it feels uncomfortable."*
    *   *Settings Drawer:*
        *   **Default:** `Inhale 4s / Exhale 4s (No holds, 5 cycles)`
        *   **Shorter-count Option:** `Inhale 3s / Exhale 3s`
        *   **Unpaced Option:** `Own pace`
        *   **Haptics Toggle:** `Phase change vibration: Off` (Off by default; never vibrates continuously).
    *   *CTA:* **Start**.
*   **Screen 2 — Guided Run:**
    *   *Visual & Clock:* A single foreground phase clock drives both the expanding/contracting central shape and large text: **"Breathe in gently"** / **"Breathe out gently"** + `"Cycle 2 of 5"`.
    *   *Reduced Motion Mode:* Replaces scaling with a static shape, phase labels, and a simple changing indicator.
    *   *Own Pace Mode:* Turns off phase timers and cycle counts, displaying **"Breathe comfortably"** with a still illustration and **Done**.
    *   *Controls:* **Pause** (freezes phase clock immediately), **Change pace** (restarts cleanly on a fresh inhale after selection), and **Finish**.
*   **Screen 3 — Finish:**
    *   *Copy:* **"This round is over."**
    *   *CTAs:* **Another round** or **Back to Actions / Talk** (no presumed calm state).

---

### Slot 3: Brain Dump (`BrainDumpExperience`)
*   **Core Experience:** A spacious, interruption-free notebook canvas supporting both typing and hold-to-speak chunks.
*   **Screen 1 — Intro:**
    *   *Illustration:* Loose ink lines on an open page.
    *   *Copy:* **"Get it out. It does not need to make sense yet."** → **Start**.
*   **Screen 2 — Capture Canvas:**
    *   *Editor:* Blank multiline ruled canvas fills the screen above the keyboard; typing works immediately without a mode-picker screen.
    *   *Collapsible Prompt Drawer (`Need a starting line? ▾`):* Inserts an optional starting question at the cursor and collapses immediately (no AI replies after chunks):
        1. *"What is taking up the most space in my head right now?"*
        2. *"What am I tired of carrying today?"*
        3. *"If I didn't have to make sense or be polite, what would I say?"*
    *   *Voice Chunk Capture (`Hold to speak`):* Only shown if transcription is verified functional.
        *   *Press:* Shows `Starting mic…`, switching to `Recording` only when capture is live (early release cancels pending start).
        *   *Release:* Shows `Transcribing…` in a pending paragraph slot identified by an immutable `chunkId` and edit revision. The user can keep typing above it; when the transcript returns, it inserts into its pending slot with a brief highlight without overwriting newer edits.
*   **Screen 3 — Review & Excerpt Handoff:**
    *   *Controls:* **Edit**, **Talk about a part**, and **Clear and leave**.
    *   *Talk Handoff Flow:* Tapping **Talk about a part** opens text selection/trimming and an exact preview modal. Confirming **Open in Talk** places only that excerpt into a visible editable Talk draft (guarded by a one-time transfer ID). The person still presses Send. Clear source draft state only after handoff acknowledgement and final exit; on failure retain it with Retry or Stay here.

---

### Slot 4: One Small Step (`OneSmallStepExperience`)
*   **Core Experience:** Merges *Task Reset* and *Tiny Next Step* into a two-door flow that ends with one usable **Next Action Card**.
*   **Screen 1 — Dual-Entry Intro:**
    *   *Illustration:* Scattered stack of slips next to one clear stepping stone.
    *   *Copy:* **"Make one thing easier to start."**
    *   *Two Explicit Start Buttons:*
        *   **Too many things** *(Opens multi-slip capture & bucket sort)*
        *   **I know the task** *(Opens single-task capture & skips sorting)*
*   **Screen 2 — Capture & Bucket Sort (Multi-Task Path):**
    *   *Capture:* Editable task slips with **+ Add another** (no minimum item count required).
    *   *Choose:* Single-column accessible bucket selector per slip (`Now` / `Later` / `Not now`) via tap or Move menu. User selects **one** slip to shrink while non-selected slips remain preserved in session memory.
*   **Screen 3 — Shrink (Define First Move):**
    *   *Header:* Displays the selected task above an input field: **"What is the first small move?"**
    *   *Static Examples Drawer (`Need an example?`):* Shows proposed local examples the user can tap to insert and edit:
        *   *"Open the presentation and write one heading."*
        *   *"Reply with one sentence to confirm I saw the message."*
        *   *"Put the items I need on the table without starting yet."*
        *   *"Spend 2 minutes listing just the rough bullet points."*
    *   *Optional Cue Field:* **"When would this fit? (Optional)"** (Saves as text on the card; never creates a background push alarm).
*   **Screen 4 — The Next Action Card:**
    *   *Visual:* Crisp bordered card displaying the confirmed first move and optional cue.
    *   *CTAs:* **Try now**, **Keep in Actions** (previews exact retained wording and saves idempotently to the `Continue` shelf), **Edit**, and **Return**.
*   **Screen 5 — "Try Outside Mira" Away State:**
    *   *Away Screen:* **"Come back whenever."**
    *   *On Return:* **Tried it** · **Not yet** · **Skip** (Separates finishing the planning flow from completing the real-world task).

---

### Slot 5: Notice & Name (`NoticeNameExperience`) + Optional CBT Branch
*   **Core Experience:** Find words that fit the moment—including mixed feelings or uncertainty—with optional *How We Feel* definitions and an optional *Clarity* thought-check branch.
*   **Screen 1 — Intro:**
    *   *Illustration:* Floating word shapes.
    *   *Copy:* **"What comes closest to this moment?"** → **Start**.
*   **Screen 2 — Word Canvas & Definitions:**
    *   *Layout:* Stable, non-moving wrapped chip grid (selected state uses border + checkmark + text, never good/bad colors). Tapping **`ⓘ`** on any chip opens the **Word-Definition Bottom Sheet**:

| Proposed Word ID | Plain Definition Copy | Nearby Sibling Words |
| :--- | :--- | :--- |
| `worried` (**Worried**) | "Your mind keeps circling around what might go wrong or what comes next." | *Uneasy · Tense · On edge* |
| `disappointed` (**Disappointed**) | "Something you hoped for, expected, or needed didn't happen the way you wanted." | *Let down · Deflated · Discouraged* |
| `angry` (**Angry**) | "Something feels unfair, crossed a line, or blocked what matters to you." | *Frustrated · Irritated · Resentful* |
| `lonely` (**Lonely**) | "You want connection, understanding, or company that doesn't feel reachable right now." | *Left out · Disconnected · Unseen* |
| `overwhelmed` (**Overwhelmed**) | "It feels like there is more to deal with than you can manage right now." | *Flooded · Stretched thin · Frazzled* |
| `numb` (**Numb**) | "It's hard to feel much of anything—like your emotions are muted or far away." | *Flat · Drained · Shut down* |
| `okay` (**Okay**) | "Things feel steady enough right now—neither strongly pulled down nor keyed up." | *Settled · Calm · Manageable* |
| `excited` (**Excited**) | "You feel energized and looking forward to something ahead." | *Hopeful · Eager · Energized* |
| `mixed` (**Mixed**) | "Two or more different feelings are showing up at the exact same time." | *Torn · Conflicted · Bittersweet* |
| `not_sure` (**Not sure**) | "Nothing on the list quite fits yet, and that is a completely valid place to pause." | *Hard to name · Still sorting it out* |
| `custom` (**My own words**) | Opens custom chip input (supports English, Hinglish, and mixed phrases). | *(User-authored)* |

*   **Screen 3 — Refine & Phrase Card Review:**
    *   *Sentence Builder:* Selected words populate an editable sentence: **"Right now, I feel …"** (asks before overwriting if the user hand-edited the sentence) + optional **"Want to add what happened?"**.
    *   *Review Card:* Titled **"You chose"** (never *"Mira detected"*).
    *   *CTAs:* **Done**, **Bring this to Talk** (previews exact phrase), **Edit**, and secondary link **Check a thought**.
*   **Screen 4 — Optional Branch: "Check This Thought" (within this slot):**
    1.  **Situation (Optional):** *"What happened?"* (e.g., *"They have not replied since yesterday."*).
    2.  **Interpretation:** *"What is your mind telling you this means?"* (e.g., *"They think I am annoying."* — labeled as the user's interpretation, never a distortion).
    3.  **Consider (Presented 1 at a time, each skippable):**
        *   *"What supports that reading?"*
        *   *"What is still unknown?"*
        *   *"Is there another plausible explanation?"* (No requirement to invent a positive spin).
    4.  **Own Wording:** *"What feels like a fairer way to put it, if anything?"* (e.g., *"I do not know why they have not replied. I can decide later whether to follow up."* — user can keep their original interpretation unchanged).
    5.  **Branch Review Card:** Shows **What happened / My interpretation / My current wording** with **Done**, **Edit**, **Bring this to Talk**, or **Return to feeling phrase**.

---

### Slot 6: Unsent Letter (`UnsentLetterExperience`)
*   **Core Experience:** Write something addressed to someone on a stationery canvas with zero expectation or mechanism of contact.
*   **Screen 1 — Intro:**
    *   *Illustration:* Open envelope with an unwritten sheet.
    *   *Copy:* **"Write what you wish you could say. You do not have to send it."** → **Start**.
*   **Stage 2 — Letter Canvas with Optional Address:**
    *   Optional **To…** field above the editor; accept a role, alias, “Myself,” or no name. This is not a separate navigation step and never accesses contacts.
    *   One spacious editor with a collapsed **Need a starting line?** drawer: “What happened?”, “What I wish you understood”, “What I needed”, “What I want now.”
    *   The optional “Try around 100 words” challenge is a secondary setting. Its approximate word count never validates or blocks the activity.
*   **Stage 3 — Read View & Optional Perspective:**
    *   *Stationery View:* Folds the keyboard away and renders the user's exact letter as a formatted page with **Edit** available.
    *   *Optional Secondary Prompt:* **Another possible perspective** invites a separate user-authored paragraph (never impersonates the recipient or uses AI roleplay).
    *   *Closure CTAs:* **Discard and close** (optional calm folding animation after confirmation; clears activity-owned state with no fake Undo after final disposal), **Keep editing**, or **Talk about a selected part** (exact preview/confirmation; raw letters are never saved to `Continue`).

---

### Slot 7: Reach Out (`ReachOutExperience`)
*   **Core Experience:** Draft a practical message asking for human contact and export it honestly via the system clipboard.
*   **Screen 1 — Intro:**
    *   *Illustration:* Draft message card on paper.
    *   *Copy:* **"Want help finding the words to contact someone?"** → **Start** or **Not right now**.
*   **Screen 2 — Intent & Draft Editor:**
    *   *Optional Recipient Alias:* `"Alias or 'I know who' (Optional)"` (never turns into a suggested phone contact).
    *   *Four Intent Buttons & Proposed Starter Text (Populated only after explicit choice; 100% editable):*
        *   **Someone to listen:** *"Hey, have you got a few minutes? I could use someone to talk to."*
        *   **Some company:** *"Hey, are you free sometime soon? Would be good to hang out or catch up for a bit."*
        *   **Practical help:** *"Hey, have you got a quick moment to help me think through something practical?"*
        *   **My own message:** Blank editable message card.
*   **Screen 3 — Preview & Clipboard Export:**
    *   *Visual:* Message card displaying a clear **`Not sent`** badge.
    *   *Primary CTA:* **Copy message** with inline notice: *"Copies this text to your phone clipboard. You choose where to paste it."*
    *   *Behavior:* Tapping copies immediately via `expo-clipboard` and updates the badge to **`Copied`** (never shows a fake delivery checkmark or promises that deleting the in-app draft retracts pasted text).
    *   *Secondary CTAs:* **Edit**, **Keep for later** (saves minimum draft/label to `Continue` with explicit consent), and **Return**.
*   **Screen 4 — Optional Return Self-Report:** Offers **I reached out** · **Not yet** · **Skip**.

---

### Slot 8: Move / Change Your Scene (`MoveSceneExperience`)
*   **Core Experience:** Choose an accessible real-world reset and let the phone become secondary.
*   **Screen 1 — Intro:** Doorway/window/chair illustration. **"Would a change of pace fit right now?"** → **Start**.
*   **Screen 2 — Choose Accessible Action:**
    *   Illustrated cards: **A short walk**, **Move comfortably where I am** (seated/gentle option with immediate stop guidance), **Change spot**, **My own break**, or **Skip**.
*   **Screen 3 — Prepare:**
    *   Shows one matching instruction (e.g., *"Choose a nearby place that feels comfortable."*), an optional secondary toggle **`Show an elapsed clock`**, and **Start my break**.
*   **Screen 4 — Still Away State:**
    *   *Visual:* Completely still screen.
    *   *Copy:* **"You can put your phone away. Come back whenever."** (Locking the screen or switching apps is expected; no background JS timer, GPS, or pedometer runs).
*   **Screen 5 — Return:**
    *   Recomputes wall time from timestamps on return (hidden if a clock anomaly is detected) and labels it **"Time since you started"** (never *"Minutes walked"*).
    *   *Self-Report:* **Tried it** · **Changed my mind** · **Skip**, plus optional explicit save to `Continue`.

---

### Slot 9: One Song Break (`OneSongExperience`)
*   **Core Experience:** A bounded one-song listening break using the music app the user already wants.
*   **Screen 1 — Intro:** Record and headphones illustration. **"Give yourself one song."** → **Start**.
*   **Screen 2 — Choose Source:**
    *   **Default:** **I will choose in my music app**.
    *   **Optional:** **Use a music link** (accepts only allowlisted HTTPS music domains; requires no OAuth or account linking).
*   **Screen 3 — Handoff:**
    *   For a valid link, displays the destination domain and **Open music** (via React Native `Linking` with failure fallback to manual switching).
    *   Without a link, **Ready — I will switch apps** enters the away state.
    *   *Audio Rule:* Initiating handoff stops all active `Talk` speech and releases mic capture.
*   **Screen 4 — Still Away State:**
    *   *Visual:* Static record illustration (no spinning animation, fake progress bar, or 3-minute auto-complete).
    *   *Copy:* **"Listen to your song. Come back if you want."**
*   **Screen 5 — Return:**
    *   *Self-Report:* **Listened** · **Stopped early** · **Skip**, then **Back to Actions / Talk**.
    *   *Quiet Return Rule:* Returning to `Talk` keeps voice output suspended so Mira never talks over continuing music; the user must explicitly tap to resume voice while text remains ready.

---

## 5. Master Visual & Asset Manifest

| Activity | Card & Intro Illustration | In-Run Interactive Asset / Canvas | Reduced-Motion / Static Fallback |
| :--- | :--- | :--- | :--- |
| **Grounding** | Window and desk | Eye, sound, and contact icons + animated fill markers | Same icons + static markers with text counts |
| **Paced Breathing** | Nested soft shapes | One scalable soft shape inside a fixed reference outline | Readable phase label + still shape |
| **Brain Dump** | Loose ink line on page | Subtle paper texture + honest recording status indicator | Plain readable multiline editor |
| **One Small Step** | Stack and stepping stone | Selected task slip + bordered **Next Action Card** | Ordered list with selected state + bordered card |
| **Notice & Name** | Floating word shapes | Stable selectable chips (border + checkmark + text) | Plain labeled button choices |
| **Unsent Letter** | Open envelope and sheet | Stationery letter page + optional close fold transition | Standard text editor and bordered read view |
| **Reach Out** | Draft message on paper | Message card preview with `Not sent` / `Copied` state | Editable message box with plain status text |
| **Move / Scene** | Doorway, chair, and window | Choice illustrations → completely still away scene | Text choices + static away card |
| **One Song Break** | Record and headphones | Destination domain badge + static away state | Text handoff with static music icon |

---

## 6. Software Architecture, Privacy & Catalog Migration

### 6.1 Shared Architectural Responsibilities (No New Backend or Agents)

| Architectural Unit | Core Responsibility |
| :--- | :--- |
| **Canonical Versioned Catalog** | Stores approved IDs, content versions, step scripts, allowed choices, eligibility rules, and display metadata. |
| **Activity Registry** | Maps each canonical ID to one of the 9 fixed presentation modules (no LLM-invented workflows). |
| **Activity Session Controller** | Validates start eligibility, assigns unique `runId`, tracks `origin` (`talk`, `actions_library`, `actions_continue`), handles hardware Back, and enforces volatile disposal. |
| **Audio Coordinator** | Enforces exclusive ownership between `Talk` speech, `Brain Dump` voice-draft capture, and external music suspension. |
| **Draft Handoff Adapter** | Previews exact user-selected excerpts and transfers once to `Talk` in memory using a deduplicated transfer ID (never via route URLs). |
| **Continue Repository** | Persists only the minimal confirmed next action or draft (`One Small Step`, `Reach Out`, `Move`) with run-level idempotency and atomic delete. |
| **Away Activity Adapter** | Handles `AppState` foreground/background transitions and timestamp comparison for real-world breaks without background timers. |
| **Outcome / Preference Adapter** | Keeps participation, optional session feedback, and explicit future-preference consent strictly separate. |

### 6.2 Persistence & Privacy Matrix by Feature

| Feature Content | Default Session Handling | Allowed Durable / Export Path |
| :--- | :--- | :--- |
| **Grounding counts & Breathing cycles** | Volatile run state; cleared on final exit | **None** |
| **Brain Dump raw text & audio chunks** | Volatile; temporary audio follows explicit cleanup; cleared on final exit | **No `Continue` save**; explicit selected excerpt handoff to `Talk` only |
| **One Small Step task slips** | All slips volatile during run | Save **only** the confirmed single next action + optional cue to `Continue` |
| **Notice & Name words / CBT Thought Check** | Volatile during run; no hidden mood profile | Explicit selected phrase/card handoff to `Talk` only |
| **Unsent Letter draft & perspective** | Volatile; cleared from activity-owned state on final discard/close | **No `Continue` save**; explicit selected excerpt handoff to `Talk` only |
| **Reach Out message draft** | Volatile during editing | User-initiated OS clipboard copy OR explicit minimum draft save to `Continue` |
| **Move / Scene choice & elapsed time** | Volatile in-memory away session | Optional user-confirmed future action saved to `Continue` |
| **One Song Break link & self-report** | Volatile in-memory away session | **None** (no listening history or taste profiling) |

### 6.3 Legacy Catalog Migration Plan

| Legacy v1 ID | Revised v2.2 Slot & ID | Migration & Legacy `Continue` Handling |
| :--- | :--- | :--- |
| `grounding` | **Grounding** (`grounding`) | Preserve ID; version sequence schema (`3-2-1` vs `5-4-3-2-1`). |
| `pause_60s` | **Paced Breathing** (`paced_breathing`) | New ID; keep old `pause_60s` saved records readable as legacy items. |
| `brain_dump` | **Brain Dump** (`brain_dump`) | Preserve ID; version voice-chunk and excerpt-handoff contract. |
| `task_reset_60s` + `tiny_next_step` | **One Small Step** (`one_small_step`) | New unified ID; legacy saved records retain their original source mode/version. |
| `name_a_feeling` | **Notice & Name** (`name_a_feeling`) | Preserve ID if contract-compatible; version definition sheet & CBT branch. |
| `reach_out` | **Reach Out** (`reach_out`) | Preserve ID; adopt explicit `expo-clipboard` export contract. |
| `short_movement` | **Move / Change Your Scene** (`short_movement`) | Preserve or version explicitly if expanded seated/scene choices alter schema. |
| `sleep_wind_down` | *(Removed from primary 9-slot catalog)* | Keep existing saved `Continue` items readable/removable; never convert to music. |
| *(None)* | **Unsent Letter** (`unsent_letter`) | Net-new ID added to FastAPI allowlists and mobile registry together. |
| *(None)* | **One Song Break** (`one_song_break`) | Net-new ID added to FastAPI allowlists and mobile registry together. |

### 6.4 Sequential implementation

Follow **Section 10**: foundation first, then one complete activity per work order. The nine-slot catalog is the final target. While work is incomplete, retain working existing behavior and use developer-only routes/capability gating for unfinished modules; do not advertise unsupported activities in a user-facing demo.

---

## 7. Master Acceptance & Verification Checklist

*   [ ] **Grounding:** Counters clamp at target count; no auto-advance on final tap; `Undo`, `Back`, and `Skip` preserve state accurately; skipped senses are never logged as completed; zero camera/mic access.
*   [ ] **Paced Breathing:** Phase labels and visual shape stay synced to a single foreground clock; backgrounding pauses immediately; changing pace restarts on a fresh inhale; Reduced Motion uses static indicators.
*   [ ] **Brain Dump:** Typing works when voice is unavailable; early mic release cancels pending start; late transcription callbacks never overwrite newer typed edits or bleed into another `runId`; raw dump state is cleared on final exit/discard.
*   [ ] **One Small Step:** Both entry doors work; sorting/editing never loses slips; saving to `Continue` is idempotent and stores only the confirmed first move; `Try now` never assumes the real-world task occurred.
*   [ ] **Notice & Name + CBT Branch:** Supports multiple words, custom/Hinglish input, and *Not sure*; hand-edited sentences are protected; CBT branch is strictly optional, skippable at every step, and leaves original feelings valid.
*   [ ] **Unsent Letter:** Works with blank addressee and any word count; switches cleanly between write and read modes; zero send capability; discarding clears the activity-owned state and cancels pending work; no secure memory-erasure promise.
*   [ ] **Reach Out:** Starter text populates only after intent selection; `Copy message` writes exact payload to clipboard and shows truthful `Copied` or error state; never requests contacts permission.
*   [ ] **Move / Change Your Scene:** Includes seated/accessible options; locking the phone during the away state is treated as normal; optional clock is labeled *"Time since you started"* and hidden on clock anomalies.
*   [ ] **One Song Break:** Rejects non-allowlisted URI schemes; handles missing music apps gracefully; shows no fake playback progress; returning to `Talk` keeps voice output muted until explicitly resumed.
*   [ ] **Privacy & Security Audit:** Zero raw writing, feeling words, or thought records appear in route URLs, crash breadcrumbs, debug logs, or automatic form persistence.

## 8. Visual compositions the implementer must follow

These describe hierarchy, not fixed-height screenshots. Preserve safe areas, text scaling, small-screen readability, keyboard access, and the current app's selected tokens. An illustration cannot replace an instruction, and a text row with an emoji is not a finished illustrated activity.

### 8.1 Shared anatomy

- **Top bar:** one Back/Close control, concise activity title, and reachable Help. Avoid stacking another decorative title/header below it on every run screen.
- **Intro:** large local illustration, one clear promise, a sentence about the action, and a single main start action. Existing Talk acceptance should not produce a redundant intro confirmation.
- **Run canvas:** the activity's distinctive interaction occupies most of the usable space. Settings, examples, and definitions are secondary drawers, not always-open panels.
- **Footer:** one visually primary action. Keep related secondary actions as quiet labeled controls. Destructive discard must be clearly named and cannot be the only way to finish reading.
- **Result:** show the actual artifact or factual end state. Do not replace the user's output with an AI motivational paragraph.
- **Keyboard:** useful editor and footer controls remain reachable, with scrolling when required. Do not force the entire screen into a tiny card above the keyboard.

### 8.2 Activity-specific hierarchy

| Activity | Dominant composition | Primary action at that stage | Secondary content | Result composition |
|---|---|---|---|---|
| Grounding | One sense illustration, short instruction, large marker row | Noticed one; Continue at target | Undo after input; Skip this sense | Compact noticed/skipped summary and return |
| Breathing | One large pacing shape, phase label above it | Pause during run; Resume when paused | Collapsed pace settings, Finish | Quiet end state with return; optional repeat |
| Brain Dump | Spacious editor with status near mic | Done/review; deliberate hold-to-speak capture | Collapsed prompts, text fallback | Readable draft plus Edit and selected-excerpt handoff |
| One Small Step | Editable slips, then one selected action card | Choose this; then confirm first move | Optional bucket sort and examples | Exact first action, cue if supplied, Try/Keep |
| Notice & Name | Readable chip grid, then editable phrase | Review phrase / Done | Definitions; optional thought-check link | User-owned phrase or optional thought card |
| Unsent Letter | Optional To field above a full writing page | Read letter | Collapsed prompt drawer; optional word challenge | Full readable letter, Edit, Return; optional explicit discard/share excerpt |
| Reach Out | Intent choices, then editable message card | Review; then Copy message | Optional alias, Keep for later | Exact wording; separate Not sent and copy status |
| Move / Scene | Accessible illustrated choices, then still scene | Start my break | Optional informational elapsed clock | Self-report and return, no movement score |
| One Song | Music source choice/domain preview, then still scene | Open music or Ready, I'll switch apps | Optional link field, manual fallback | Self-report and quiet return, no fake player |

**Letter exit clarification:** a normal Return with a nonempty temporary letter invokes the lightweight discard-or-keep-editing decision. Keep editing stays in the live session; it is not durable storage. Do not invent Journal or raw-letter Continue saving to make that dialog look complete.

**Reach Out status clarification:** Not sent is a delivery fact; Copied is an export fact. Display them separately if both are shown. Copying must not visually imply the message was sent.

**Definition access:** give each word a clearly labeled definition action or a readable selected-word detail sheet. Do not squeeze an inaccessible tiny information icon into a 48 dp chip; both selection and definition must have usable targets.

**Asset completion rule:** each completed activity work order includes its finished original local assets and static fallback, not a placeholder awaiting a later polish phase. Use the installed vector/native rendering stack where appropriate. If a new renderer is truly needed, explain why and select a project-compatible version; do not casually upgrade Expo/RN. Avoid copying competitor artwork.

## 9. How to hand work to Codex one task at a time

### 9.1 Setup once

Place this document in the repository's existing product-documents location, normally `PRD/`, preserving its chosen filename. If a matching source already exists, update that file rather than creating competing main specs. Use a single status ledger, proposed `PRD/mira_activity_build_status.md`, only if no suitable tracker already exists. The implementer discovers the real repository layout in Work Order 00.

The ledger should record work-order ID, status, dependency, real changed paths, checks run/results, known issues, device checks pending, and next order. Record only synthetic examples. Do not copy private user writing, secrets, or raw recordings into it.

Allowed statuses: **not started**, **in progress**, **implemented—verification pending**, **complete**, or **blocked with reason**. Never mark a device test passed merely because type checking passed. Existing uncommitted work is preserved; do not reset, stash, overwrite, or commit unrelated changes to make the tree look clean.

### 9.2 Reusable instruction to paste

```text
Use the attached Mira Nine Activities Master Blueprint, revision 2.2, as the activity implementation target. Read applicable AGENTS.md instructions and the existing build-status ledger first.

Implement WORK ORDER [ID] ONLY, including its detailed acceptance checks. Inspect the real repository before assuming filenames, APIs, or dependency versions. Reuse existing working infrastructure; preserve unrelated work and existing Talk/Journal/Help behavior.

Finish the selected order end to end: functional input and state, original local visual assets, responsive layout, return/error paths, and relevant verification. Do not substitute text placeholders or fake functionality for specified interactions. Use synthetic data.

Make routine reversible implementation decisions within this order without repeatedly asking for confirmation. If a known dependency is missing, complete the necessary work within the order where reasonably scoped, or report a concrete blocker. Do not expand into another activity or silently redesign the product.

Update the status ledger with evidence. Report what changed, exact checks and their outcomes, device/visual checks still pending, and the next work-order ID. Stop after this order; do not automatically implement all remaining orders. Do not deploy, publish, send external messages, or alter unrelated files.
```

Replace `[ID]` with `00`, `01`, and so on. A later instruction “continue with the next work order” means the next dependency-ready order, not permission to run the full backlog at once. The user can also name a specific order. A selected order should not end at a plan when code implementation is requested.

### 9.3 Definition of done for every activity order

- Its actual entry path and origin-aware return work through the shared runner.
- Its main interaction, finish/stop/back behavior, and required failure paths work.
- Its own asset set, final output view, keyboard behavior where relevant, reduced-motion fallback, and accessible control names are present.
- It preserves temporary-versus-saved data boundaries and does not make unsupported sensor/playback/delivery claims.
- Run focused tests for meaningful state, privacy, timing, or persistence risks and the repository's applicable required checks. Do not add brittle tests of every style token or re-run unrelated suites repeatedly without reason.
- Render/inspect the implemented screens with synthetic data where the environment supports it. Record any native/device checks that cannot be performed. Do not claim visual or device verification from code inspection alone.
- Report new gaps honestly. A beautiful static screen or passing type check alone is not completion.

## 10. Sequential Codex work orders

| Order | Scope | Finish before moving on |
|---|---|---|
| 00 | Repository audit and document alignment | Actual path/contracts map and status ledger |
| 01 | Shared runner and Actions frame | Correct entry, resume, return, data and audio ownership contracts |
| 02 | Grounding | Complete counter-driven guide |
| 03 | One Small Step | Complete task-to-action and Continue flow |
| 04 | Unsent Letter | Complete write/read/discard/excerpt flow |
| 05 | Notice & Name | Complete words/definitions and optional thought check |
| 06 | Paced Breathing | Complete timed guide and interruptions |
| 07 | Reach Out | Complete message draft/copy/keep flow |
| 08 | Move / Change Your Scene | Complete accessible offline break flow |
| 09 | One Song Break | Complete external music handoff and quiet return |
| 10 | Brain Dump, typing | Complete ninth activity and excerpt flow |
| 11 | Brain Dump, voice extension | Reliable verified hold-to-talk or an explicit blocker |
| 12 | Final integration | All nine usable, compatibility and validation report |

### Work Order 00 — Reconcile documents and inspect the repository

**Dependency:** none. **Scope:** repository inspection and planning/doc changes; no activity application code yet.

**Goal:** one authoritative target and a real map of what exists, rather than assumptions about old file names.

1. Read relevant repository instructions and inspect git status without changing user work.
2. Locate actual Actions, Talk, Do runner, voice/capture, catalog, eligibility, run lifecycle, outcomes, and Continue storage implementations.
3. Confirm installed Expo/RN/audio/animation packages and available test/render/device commands from the project itself.
4. Put this corrected blueprint in the existing document structure. Reconcile stale statements about the original nine and the already approved Actions library. Preserve unrelated product contracts.
5. Record a nine-row map: revised ID, existing renderer/endpoint if any, proposed replacement/extension, allowed input, retention, and relevant tests. Do not invent an endpoint because another plan named it.
6. Create/reuse the build-status ledger and identify existing microphone defects that may block Brain Dump voice.

**Deliverable:** corrected docs in the repo, actual path/contract map, and an ordered ledger. The supplied review fixes have already been applied in this document; do not reopen their product decisions.

**Check:** exactly nine final slots; no fake citations/export boilerplate; proposed copy not labeled reviewed; library/Continue start semantics distinguished. Report unavailable native test tooling. No code tests are needed for doc-only edits unless repository rules require them.

**Stop after 00. Next: 01.**

### Work Order 01 — Establish the shared activity foundation and Actions frame

**Dependency:** 00. **Scope:** shared infrastructure and collection frame; do not implement all nine canvases.

1. Reuse the current runner/navigation. Add only the necessary versioned activity registry and per-run origin/identity contracts.
2. Distinguish library intro, accepted Talk entry, and Continue resume. Continue opens the saved compatible action/draft; a return from background is not a fresh launch.
3. Implement/reuse the common top bar, intro, content area, footer, simple result view, and optional feedback presentation. Preserve Help.
4. Establish cancellation/final-disposal behavior, exact selected-text handoff into a visible Talk draft, and run/transfer deduplication. Source content is retained if transfer fails.
5. Reuse Continue storage and its failure states. Make save/delete idempotent and keep prior saved state visible on failure.
6. Add the static Actions grouping/layout foundation. Do not replace working existing activities with nonfunctional new cards. Use developer-only previews and capability/version gating while modules are incomplete; only implemented IDs may be offered by the server to a compatible client.
7. Introduce only currently needed shared visual primitives; later activity orders add their own controls. No general workflow engine or broad app restyle.

**Check:** one existing working activity enters/returns correctly from Talk and Actions; a saved item resumes; malformed ID/version is rejected; repeated taps do not duplicate runs; no raw data in URLs/logs; original Talk and Journal paths still work. No unrelated audio-stack rewrite.

**Deliverable:** functioning foundation, collection frame, and compatibility policy. Record actual registry/catalog rollout wiring, not a speculative architecture diagram.

**Stop after 01. Next: 02.**

### Work Order 02 — Implement Grounding completely

**Dependency:** 01. **Blueprint:** Slot 1, simplified controls, and Section 8 composition.

1. Create original local window/eye, sound, and contact illustrations plus static fallbacks.
2. Build the quick 3-2-1 sensory sequence as the proposed demo content. Show a full 5-4-3-2-1 alternative only if its entire reviewed/adopted catalog variant is actually supplied and implemented; no dead option.
3. Implement acknowledged counts, clamp, contextual Undo, explicit Continue at target, previous step, Skip this sense, and immediate exit. No acknowledge-all button or optional text editor in this slice.
4. Keep narration out unless existing accessible text/screen-reader support already serves it; do not advertise a fully eyes-off mode that does not exist.
5. Add factual noticed/skipped result and origin-aware return. Wire this renderer and valid content version through the existing start/eligibility path.

**Check:** rapid taps never exceed target; Undo restores counts; back navigation retains live state; skip is not completion; all senses can be skipped; reduced motion is equivalent; no camera/mic permissions; loaded content survives network loss. Render intro, one active sense, skipped state, and finish at normal/large text.

**Deliverable:** one complete guided activity with finished assets. Keep the other new modules out of scope.

**Stop after 02. Next: 03.**

### Work Order 03 — Implement One Small Step completely

**Dependency:** 02. **Blueprint:** Slot 4 and legacy catalog map.

1. Build the two entry modes, editable task slips, optional single-column bucket assignment, and one-task selection. Reuse common controls; do not require drag gestures.
2. Add first-move editing, a collapsed examples drawer, and an optional text cue.
3. Build the final action card with Try now, Keep in Actions, Edit, and Return. Keep previews the exact retained action/cue. A cue does not schedule anything.
4. Connect saved action resume, completion/removal, and truthful save/delete failures to Continue.
5. Add away/return self-report for Try now. Keep planning completion separate from the external task outcome.
6. Introduce `one_small_step` with correct backend/client compatibility. Preserve older Task Reset/Tiny Next Step records and unrelated existing behavior.

**Check:** both modes reach a useful action; grouping/editing loses no item; repeated save creates one continuation; failed save remains unsaved; restart recovers only deliberately saved output; no full task dump is retained; legacy saved items stay readable. Inspect capture, selection, final card, and resumed card visually.

**Deliverable:** a complete path from competing tasks to a usable, optionally retained first action.

**Stop after 03. Next: 04.**

### Work Order 04 — Implement Unsent Letter completely

**Dependency:** 03. **Blueprint:** Slot 6 with merged address/editor stages.

1. Create original envelope/page assets and a spacious editor. Optional To field belongs above it, not on a mandatory separate screen.
2. Add the collapsed starting-prompt drawer. Keep the approximate 100-word challenge optional and nonblocking.
3. Implement readable letter review, reliable return to editing, final-return discard decision, and explicit disposal. No fake Undo after final disposal.
4. Optional perspective writing is secondary and user-authored; do not add AI recipient roleplay. Implement it only as the documented branch, not a new catalog slot.
5. Reuse the selected-excerpt preview and Open in Talk draft handoff. Preserve source content until acknowledged; no auto-send or Journal save.

**Check:** blank addressee, arbitrary length, mixed-language text, keyboard/back, edit/read transitions, temporary backgrounding, discard, and failed handoff all behave correctly. Final exit clears owned state; no letter enters Continue. Inspect editor with keyboard and full letter review at large text.

**Deliverable:** a complete expressive activity that feels distinct from a generic note field.

**Stop after 04. Next: 05.**

### Work Order 05 — Implement Notice & Name completely

**Dependency:** 04. **Blueprint:** Slot 5 and its optional thought-check branch.

1. Add stable multi-select word chips, custom wording, Not sure, and plain original proposed definitions with nearby alternatives.
2. Use accessible definition access; preserve the distinction between selecting a word and opening its definition.
3. Build the editable feeling phrase and optional context. Never overwrite manual edits silently.
4. Implement the optional Check a thought branch: situation, interpretation, optional considerations, own wording, and review. All fields can be skipped; an unchanged interpretation is valid. Canceling returns to the feeling phrase without losing it.
5. Reuse exact Talk-draft preview/handoff. Do not add a classifier, mood history, diagnostic labels, or hidden trait storage.

**Check:** multiple/custom/Hinglish/uncertain input; selected-state accessibility; protected phrase edits; ordinary completion without the branch; canceled branch; no forced positive wording; no raw thought record retained. Inspect chips, definition sheet, phrase, and branch review.

**Deliverable:** usable emotion wording plus an optional structured reflection variant, still one activity.

**Stop after 05. Next: 06.**

### Work Order 06 — Implement Paced Breathing completely

**Dependency:** 05. **Blueprint:** Slot 2. Prototype pacing choices are not clinical prescriptions.

1. Create one original pacing shape and fixed outline. Keep pace settings collapsed on its main canvas rather than adding mandatory setup pages.
2. Implement proposed 4/4 and shorter-count 3/3 presets without holds, plus Own pace. Label guide cycles accurately; do not claim measured breaths.
3. Drive phase labels/counts and animation from one foreground timing model. Add pause/resume, pace change at a clean re-entry, finish, and optional repeat.
4. Provide equivalent reduced-motion/static guidance. Haptics can remain deferred/off unless the existing project supports and verifies them; no new dependency solely for vibration.
5. Pause guidance on background/interruption and resume intentionally. Do not auto-complete skipped background cycles.

**Check:** deterministic timing across pause/resume; frame loss cannot alter domain state; changing pace stays coherent; early exit stops guidance; own-pace mode invents no count; Android interruption handling and readable reduced-motion UI. Check actual animation/label sync visually on supported hardware.

**Deliverable:** an actual guided rhythm with clear control, not just a pulsing decoration.

**Stop after 06. Next: 07.**

### Work Order 07 — Implement Reach Out completely

**Dependency:** 06. **Blueprint:** Slot 7; copy and delivery state are separate.

1. Build intent selection, optional alias, editable local starter templates, and a practical message preview.
2. Implement deliberate Copy message through a project-compatible clipboard adapter. Show inline export meaning and truthful success/error states.
3. Keep Not sent visible as the delivery fact; Copied is a separate status, not a sent checkmark.
4. Connect explicit minimum-draft/action saving and resume through Continue. Keep confirmation wording exact; no address book, send API, recipient lookup, or notification.
5. Add optional returned self-report without inferring contact from copying or app switching.

**Check:** exact clipboard payload, failed copy, repeated copy, no permission surprises, saved-draft restart, failed save/delete, discarded draft cleanup, and no contact-side effects. A person can finish without naming or contacting anyone. Inspect intent choices, editor/keyboard, preview, and copied state.

**Deliverable:** a message someone can actually use, with honest export and retention behavior.

**Stop after 07. Next: 08.**

### Work Order 08 — Implement Move / Change Your Scene completely

**Dependency:** 07. **Blueprint:** Slot 8.

1. Create accessible illustrated options for walking, comfortable movement, changing spot, and a custom break. Include a no-movement/skip path.
2. Build one short preparation instruction and Start my break. Elapsed time remains optional and informational.
3. Implement the still away state. Backgrounding/locking is expected; there is no required moving animation to watch.
4. Recompute informational elapsed time on return without a background service/JS loop; omit unreliable time after anomalies. Ask for self-report and return.
5. Connect an explicitly chosen future action to Continue only if requested. Do not create recurring assignments after every break.

**Check:** locked phone, app switching, immediate return, early stop, elapsed-clock anomaly, process death, and accessible alternatives. No GPS, pedometer, movement inference, or false completion. Inspect choice, preparation, away, and returned states.

**Deliverable:** an honest real-world break experience and a reusable away-session primitive for the next order.

**Stop after 08. Next: 09.**

### Work Order 09 — Implement One Song Break completely

**Dependency:** 08. **Blueprint:** Slot 9 and quiet audio return.

1. Create record/headphone assets and the manual source choice. Manual app switching is a complete supported path, not a failure placeholder.
2. Add an optional validated allowlisted HTTPS music-link path if project-compatible. Display destination; handle failed opening with manual fallback. Never claim to open an unspecified installed player.
3. Suspend Talk speech/capture before handoff and reuse the away-session primitive.
4. Keep the away illustration still. No fake player, waveform, synchronized progress, or auto-completion based on an assumed song length.
5. Ask Listened / Stopped early / Skip on return. Keep Talk output suspended until explicitly resumed; text remains available.

**Check:** bad link, missing app, failed launch, no network, immediate return, continuing external audio, process death, and no listening-history persistence. No OAuth, music SDK, copyrighted bundled track, or scraper added. Inspect source choice, valid/invalid link, away state, and quiet return.

**Deliverable:** a functional bounded music handoff without pretending Mira controls playback.

**Stop after 09. Next: 10.**

### Work Order 10 — Implement Brain Dump typing and excerpt return completely

**Dependency:** 09. **Blueprint:** Slot 3. This order makes the activity genuinely useful before voice is added separately.

1. Create the original page/ink assets and spacious editor. Typing is immediately usable; prompts are collapsed and optional.
2. Reuse editor/review and exact selected-excerpt components from prior orders, while preserving Brain Dump's freeform identity.
3. Implement Done/review, Edit, Clear and leave, and Talk about a part. Preview uses Open in Talk to fill a visible editable draft; Send remains the person's action.
4. Preserve the active draft during temporary background/read-mode navigation. Clear owned state on final disposal; no raw dump Continue or Journal save.
5. Show no fake functional mic. If voice is not ready, present an honest typed experience until Order 11, without an error obstacle blocking writing.

**Check:** long/mixed-language text, keyboard/back, review/edit, selected excerpt trimming, double handoff, transfer failure, final disposal, and restart. No private content in route URLs/logs. Inspect empty capture, filled editor with keyboard, review, and Talk-draft preview.

**Deliverable:** the ninth working activity in typing mode; all nine are now usable before the separate voice extension.

**Stop after 10. Next: 11.**

### Work Order 11 — Add reliable Brain Dump push-to-talk capture

**Dependency:** 10 and the known voice lifecycle inventory from 00. **Scope:** voice capture for Brain Dump plus necessary shared audio fixes; no wholesale voice-provider rewrite.

1. Inspect actual Realtime/WebRTC event handling and installed packages. Determine how to obtain transcripts without sending a standard conversational turn or triggering AI speech.
2. Reuse the approved explicit hold-to-talk contract. Distinguish permission, transport, starting mic, recording, transcribing, failure, and idle. Show Recording only when capture is live.
3. Cancel pending capture on release-before-start; release stops the active capture. Keep one audio owner. Background/interruption stops capture and does not restart it automatically.
4. Insert editable transcript chunks using run/request IDs and edit revisions. Late/error/duplicate callbacks cannot overwrite edits or land in another run.
5. Provide retry/discard of a failed pending chunk while preserving accepted text. Clean any temporary audio artifacts according to the actual transport's behavior.
6. Keep typed input working through every voice error. If the approved transport cannot support transcript-only capture, report the concrete limitation and implement safe in-scope fixes where possible; do not substitute a new audio path or fake completion silently.

**Check:** real capture on Android; denied permission; slow mic start; immediate release; disconnected transport; transcription failure; typing during processing; late/duplicate chunks; incoming call/background; repeated entry/exit; return to Talk. Reproduce and check the misleading Voice ready error-state issue only where this order touches it.

**Deliverable:** working editable speech capture with evidence, or an explicitly blocked voice extension while typed Brain Dump remains functional. Native capture is not verified by mocked tests alone.

**Stop after 11. Next: 12.**

### Work Order 12 — Finish the nine-slot demo and integration verification

**Dependency:** 02–10; 11 either complete or honestly marked voice-blocked with typed fallback. **Scope:** integration, compatibility, remaining defects, and final validation—not new features.

1. Verify the final Actions library exposes exactly the revised nine in the intended groups, with finished local assets and no dead cards. Every ID has a supported renderer/content version.
2. Align catalog/eligibility/decision outputs and client capability gating. Preserve older saved items through compatible legacy handling rather than reinterpreting their IDs.
3. Run Talk → accepted activity → return; Actions → start → return; and Continue → resume → complete/remove. A relevant saved Action resumes without intro/start repetition.
4. Verify one-time exact excerpt handoffs and source draft retention on transfer failure; no implicit send or memory save.
5. Exercise optional feedback and future-use consent, failures, revocation/delete/reset paths, and the unchanged Help/scripted emergency-demo boundary.
6. Check all nine on physical Android when available: font scaling, TalkBack, reduced motion, keyboard, back, weak/offline data, app switching, interruption, and audio ownership. Do not claim hardware testing if no device is connected.
7. Fix actual UI defects identified in rendered/on-device review. Do not reopen the catalog or add more speculative polish features. Update docs and ledger to match the implementation that actually exists.

**Check:** all nine cards launch working activities; Talk and Actions return correctly; saved items resume correctly; raw inputs stay within their specified data boundaries; failed operations do not claim success; remaining device/voice limits are recorded explicitly.

**Deliverable:** a factual nine-activity demo checklist, exact validation evidence, build/run instructions using the project's existing commands, and concise known limitations. Voice can be labeled unavailable if genuinely blocked; it cannot be demonstrated as working without verification. No public deployment is part of this work order.

**Stop after 12. The requested sequence is complete.**

## 11. Handoff reporting and blocker handling

For every order, the implementer should finish with:

1. **Outcome:** what now works for a person using Mira.
2. **Changed paths:** actual repository paths, grouped by concern.
3. **Verification:** exact commands/checks performed and their results; synthetic screen/device observations where available.
4. **Limits:** unresolved failures, unavailable device checks, retained compatibility issues, or deliberately deferred voice/haptics features.
5. **Ledger:** selected order's honest status and next dependency-ready order.

Do not ask the user to approve routine reversible edits already inside the selected work order. Ask only for a material missing decision or action outside the authorized scope; show the concrete result first when possible. Missing tooling is not a reason to claim a test passed. Preserve working earlier modules when a later one is blocked.

At the end of 02, 03, and 04, invite review of the actual rendered experience in the status report. This is feedback on completed work, not a mandatory new permission gate. Record visual defects and fix them within the current order; do not copy an unvalidated layout to all nine merely to finish faster.

## 12. Research provenance and revision log

### Official product references

Product websites/help descriptions informed the design principles. They do not establish the exact proposed Mira gesture, architecture, worksheet, or current signed-in screen. The competitive table names inspirations; its exclusions define Mira scope and are not allegations about competitors' privacy/security practices.

- Sonia: https://soniahealth.com/ and https://apps.apple.com/ca/app/sonia-ai-for-mental-health/id6472111765 — voice/text and reflection-tool positioning.
- Wysa: https://www.wysa.com/faq-clinical-program — structured conversational/audio skills and CBT-oriented techniques.
- Clarity: https://www.thinkwithclarity.com/ — thought-reframing and guided journaling features.
- How We Feel: https://howwefeel.org/ and https://howwefeel.org/practitioners — emotion vocabulary/definitions; Mira's definitions here are original proposed wording.
- Headspace: https://www.headspace.com/meditation/breathing-exercises — animated breathing guidance.
- Finch: https://help.finchcare.com/hc/en-us/articles/37935610353293-Our-Mission — approachable small-step framing.
- Stoic: https://www.getstoic.com/features — writing prompts and guided reflection features.

These were consulted in the earlier research pass, not newly audited during this document-editing task. Do not copy proprietary text, imagery, scripts, or branding. No product claim from another app establishes Mira efficacy.

### Platform references to verify against the installed project version

- React Native AppState: https://reactnative.dev/docs/appstate
- React Native Animated: https://reactnative.dev/docs/animated
- React Native AccessibilityInfo: https://reactnative.dev/docs/accessibilityinfo
- React Native Linking: https://reactnative.dev/docs/linking
- Expo Clipboard: https://docs.expo.dev/versions/latest/sdk/clipboard/

### Revision 2.2 corrections completed in this document

- Removed exporter headers, generated thinking material, follow-up tags, and unusable citation placeholders; replaced them with an explicit provenance section.
- Labeled product wording/definitions as proposed rather than falsely reviewed; reframed competitor patterns as adaptations.
- Simplified Grounding controls and removed its optional typed evidence/acknowledge-all paths from the demo slice.
- Distinguished stages from mandatory navigation; merged letter addressing into its editor and kept breathing settings collapsed.
- Corrected Continue entry to reopen saved compatible work rather than fresh intros.
- Replaced permanent-erasure claims with explicit state/file cleanup language and defined temporary-background behavior.
- Made the excerpt handoff a visible editable Talk draft, with no implicit Send and no source loss on transfer failure.
- Added per-activity visual hierarchy and asset-completion rules.
- Replaced the vague bulk build order with bounded Work Orders 00–12: groundwork, one complete activity at a time, separate speech capture, and final integration.

**No application implementation or device verification has been performed by preparing this handoff.**
