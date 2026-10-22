# Mira UI decisions and native handoff

This is the decision log for UI Lab work. Record accepted choices here as they are made so the prototype stays a useful source for changes to Mira Mobile. Product behavior and constraints still come from the PRD and activity blueprint.

## Current selected direction

On 2026-10-21 the user selected **A — Little company** for Talk, Activities, and Journal. Use its oat/forest/peach palette, Nunito Sans, tactile sprout companion and related motifs, open activity rows, and open writing page for the next lab iteration. B remains an alternate reference; no B element has been selected to mix into A. See the [selection and five-gate critique](mira_top_three_step_05_selection.md).

Status: **Locked in Lab; native foundation, selected screens, saved outputs/shared controls, all nine activity styling passes and global theme finish implemented through RN-16.** Android review remains pending. Step 06 implemented A’s interactive Talk, Activities and Journal at the main lab URL. The previous control is preserved at `/control.html`.

## Previous baseline — retained as control

- The control uses Roboto for UI text, matching the Android app's previous baseline. Nunito Sans replaces this choice for the selected three-screen direction.
- Use Material Design Icons for interface icons, matching the app's installed icon set. Keep icon names and sizes explicit.
- The control mirrors the previous mobile palette and typography. Direction A replaces those visual choices for the three selected surfaces. The lab keeps local copies/assets and does not import mobile source.
- Preserve the 75% phone-preview scale used for visual comparison.
- Preserve the control for comparison. Use Direction A for new iterations of the selected surfaces.
- UI/UX Pro Max's automatic design-system queries returned marketing-site patterns and generic palettes. Do not use those recommendations to replace this accepted baseline. Its React Native search found useful implementation guidance: use `Pressable`, label interactive controls, set accessibility roles, and verify with TalkBack.

## Accepted decisions

| Date | Decision | Native app change to carry forward | Status |
| --- | --- | --- | --- |
| 2026-10-21 | Keep three reviewed palette directions: warm light, deep forest dark, and near-black black-out. Treat them as distinct theme options for further UI Lab review. | Define semantic colors for all three themes and apply consistently after typography, sizing, and screen review are complete. | Three palettes locked in lab; native transfer pending |
| 2026-10-21 | Keep Nunito Sans for display and body text, with current Direction A sizing (Talk title 30px, body 16px, controls 14px). | Carry the existing typeface and sizes through the branding implementation without changes. | Locked in lab; native transfer pending |
| 2026-10-20 | Match the control to the app's Roboto, existing palette, Material Design Icons, and native-like sizing. | Retain as comparison history. Icons and logical native sizing still apply. | Partly superseded by Direction A for Talk, Activities, and Journal; control retained |
| 2026-10-21 | Select A — Little company: oat/forest/peach, Nunito Sans, clay sprout art, open Activities rows and writing page. Keep B as an alternate, without blending it in. | Carry the accepted visuals to TalkScreen/PresenceHero/TalkCallControls, ActionsScreen, JournalEntryScreen and related styles through the ordered lab and native handoff steps. Preserve existing routes and behavior; shared token changes must stay within the accepted scope. | Locked in lab; native transfer pending |
| 2026-10-21 | Lock the casual handwritten “Mira” in forest as the Talk header wordmark. Keep the same-size blue and black versions available in the UI Lab for side-by-side review. | Apply the selected wordmark at the Talk header size/color, preserving its current layout after the broader branding pass. | Implemented in native TalkHeader.tsx in RN-03; phone/dark-surface review pending |
| 2026-10-21 | Approve Step 07’s visual language: use the sprout’s listening/thinking/speaking poses for Talk states; keep Activities and Journal art quieter; use the existing Material Design Icons for controls; keep Talk motion subtle, purposeful, optional, and reduced-motion aware; preserve the art across all three palettes. | Apply to Talk’s hero and state visuals, Activity and Journal illustrations, existing icon set, and motion settings during native branding implementation. | Locked in lab; native transfer pending |
| 2026-10-21 | Transfer the three selected screens first, then propagate their colors, type, icons, controls and illustration color language through all remaining screens. Keep individual activity compositions open and distinct. Skip signature-style Activities/Journal headings. | Follow the RN-00 onward sequence in the native handoff; theme existing activity experiences and supporting views without introducing a universal layout or changing capabilities. | Scope recorded; native transition planned |

## Native transition and future iteration record

Current work: RN-00 through RN-16 are complete, including the selected screens, saved outputs/shared controls, all nine activity styling passes and the global theme finish. Appearance selection is available on the main screens and activity pages, saved on device and restored on launch. The legacy Task Reset runner follows theme tokens, and the logo has a light forest variant on dark palettes. TypeScript and focused lint passed; Android rendering and live voice review are pending. RN-17 Android review is next in the [transition plan](ui-native-handoff/transition-plan.md). Individual activity compositions remain open. EAS builds are on hold at the user's request until they ask to resume.

For each UI iteration, add an accepted decision row with:

- **Decision:** the screen, state, behavior, or visual choice that was accepted.
- **Native app change:** the concrete mobile screen/component or interaction that should be updated.
- **Status:** `Locked in lab; native transfer pending`, `Implemented in mobile`, or `Superseded`.

Keep experiments and rejected options out of the accepted table. When implementing a decision in the app, update its status and note the relevant mobile files. Do not treat an unreviewed experiment as approved for native implementation.
