# Mira: UI Lab to React Native handoff

Date: 2026-10-22. Status: **RN-00 through RN-16 complete: foundation, selected screens, saved outputs/shared controls, nine activity styling passes and global theme finish are implemented. RN-17 Android review is next. Phone/live voice review is pending. EAS builds are on hold at the user's request.**

## Read these files

| File | Purpose |
| --- | --- |
| [design-tokens.json](design-tokens.json) | Exact three palettes, current type sizes, layout anchors, icon names, and motion values |
| [assets.json](assets.json) | Approved source assets, hashes, crop rectangles, font weights, and native export destinations |
| [copy.json](copy.json) | Copy used by the selected three-screen Lab; excludes mock conversations and generated results |
| [screens.md](screens.md) | Talk, Activities library, and Journal compositions, states, routes, and mobile file mapping |
| [transition-plan.md](transition-plan.md) | Small ordered native batches, including propagation through all nine activities and supporting screens |

These are handoff documents, not a package for the app to import. During implementation copy the approved values and assets into `mobile/`; retain the Lab as an independent visual reference.

## What is locked

Direction A, Little company; the casual Mira signature in forest; Warm light, Deep forest, and Black-out palettes; Nunito Sans and the current sizes; Material Design Icons; the tactile sprout companion and supporting art; restrained state-driven motion. Talk, the Activities library, and Journal are the selected screen designs. Activities and Journal headings remain normal Nunito Sans. The signature-heading experiment was skipped.

The native transition proceeds one batch at a time. Foundation, shared controls/tab shell, Talk, Activities library, Journal, saved outputs/shared activity chrome, all nine activity styling passes and global theme finish are implemented. Each individual activity's layout is still open. Carry the shared design language into its existing composition first; a finished theme pass does not mean its bespoke design has been selected. Keep its working AI assistance, visual interactions, voice/audio behavior, and saved outputs.

## Reference precedence

1. Latest user decisions and [decision log](../mira_ui_decisions.md).
2. Selected interactive Lab: `ui-lab/src/selected/`, with the effective A styles in `ui-lab/design/step-04/style.css` plus `selected.css` overrides.
3. This package: implementation translation and unresolved native details are labeled below.
4. [PRD](../../PRD/mira_prd.md) and [activity upgrade plan](../../PRD/mira_activity_upgrade_plan.md) govern behavior. Existing native behavior wins over the Lab's simulated voice, storage, AI, and activity frame bridge.

The visual-language board happens to use a `step-07` folder. It is separate from the original design plan's Step 07, which is this native handoff. Native work uses **RN-00 onward** to avoid that collision.

## Native foundation

Use a small `ThemeProvider` and `useTheme()` in `mobile/src/components/ui/theme.tsx`, plus explicit type/spacing styles. Keep styles beside each feature. Keep `ActivityFrame` as a background/flex frame; each activity owns its layout and scrolling. Add a small shared button or icon treatment only when several real screens use it. A universal screen renderer, new activity runner, or schema-driven design engine is unnecessary.

The existing `colors` and `ui` exports are static. Add the new reactive theme values alongside them and migrate consumers deliberately. A static `StyleSheet` built from yesterday's colors will not follow a runtime theme change.

### Color migration

| Existing native name | New meaning |
| --- | --- |
| `colors.accent` (currently green) | `theme.colors.primary` |
| `colors.accentSoft` | `theme.colors.soft` |
| `colors.danger` | `theme.colors.error` |
| `canvas`, `surface`, `ink`, `muted`, `line` | Same semantic roles, using the selected palette |
| `white`, `quiet`, inline white backgrounds | Review the actual use; choose `onPrimary`, `surface`, or `soft` |

In the Lab, **accent means peach**. Do not change the old green `accent` export to peach underneath every consumer. Keep the compatibility export green until those consumers migrate; new themed consumers use the explicit roles. All new ordinary UI colors come from semantic tokens.

### Theme behavior and special surfaces

- Initial native transfer defaults to Warm light. Implement all three theme objects and inspect converted screens in each. Keep a development override while the migration is incomplete.
- Apply the active theme to root/router surfaces, tabs, headers, sheets, text inputs, placeholders, selection/cursor colors, loading/error/disabled states, and system bars. A dark canvas alone is incomplete.
- The three themes are selectable through the Look control on the main screens and activity header. The preference is stored on device. Do not put a global theme switch into Journal's existing paper-color picker. No new settings screen is implied by this handoff.
- Journal paper remains the person's selected light page color with `#111111` writing text. Use paper-specific muted text and control colors on that paper, even with dark app chrome. This resolves the Lab's inherited light-text-on-light-paper problem without changing the selected writing color. A dark-paper option with light writing would require a separate decision.
- The forest signature is fixed brand artwork. On dark screens inspect it at the real header size; a tonal backing is an implementation proposal to review if needed. Do not silently replace the locked wordmark with blue or recolor it sage.
- Keep semantic emotion/sense colors and user-selected document colors meaningful. General palette propagation does not mean every illustration or state becomes green.

### Fonts and assets

Local Nunito Sans **static** TTF weights 400/500/600/700 are prepared in `mobile/assets/fonts/`, with explicit runtime aliases and verified internal names documented there and in `assets.json`. The root layout now loads them through `expo-font`; `typography.ts` provides the selected text roles and a system-font fallback. The source is the licensed Lab variable TTF; the OFL license is included. Preserve the current sizes, including existing smaller nav/side-control labels and state-specific title sizes. The 75% browser presentation scale never becomes native text sizing or a root transform.

Prefer the already installed `expo-font` runtime loading path for this transfer; fonts and images must be bundled. Avoid changing native font configuration just for iteration. Copy the approved raster artwork unchanged and render its recorded square regions with the already installed SVG viewBox/image support, preserving alpha and aspect ratio as the Lab does. Use native `Image` for the wordmark. Separate cropped exports are optional later asset preparation, not a prerequisite. Use the installed Material Design icon component rather than copying the browser icon font.

## Current implementation facts

Installed versions checked in `mobile/node_modules` on 2026-10-21: Expo `57.0.28`, React Native `0.86.3`, Reanimated `4.5.1`, Worklets `0.10.1`, SVG `15.15.4`, expo-font `57.0.4`, and Material Design Icons `13.1.5`. Recheck resolved installed versions before implementing version-specific APIs. Gesture Handler is not a declared dependency; retain the current push-to-talk press path. Use the installed animation tools; if a worklet must call the React Native thread, use `scheduleOnRN`.

React Native content and status bar use the user-selected palette. Native system appearance is unchanged because expo-system-ui is not installed. Check Android rendering, navigation/system bars, inputs and overlays during RN-17; group any needed native/config changes into one later development build. Do not start an EAS build per batch.

## Official implementation references

Checked 2026-10-21:

- [Expo fonts](https://docs.expo.dev/develop/user-interface/fonts/): local fonts/runtime loading; SDK 57 needs static native font files. Latest-guide SDK 58 variable-font advice does not apply to this app yet.
- [Expo color themes](https://docs.expo.dev/develop/user-interface/color-themes/): app appearance configuration and Android system-UI support. SDK 57 app config documents that Android `userInterfaceStyle` requires `expo-system-ui`; it is not installed here, so native system appearance stays unchanged in RN-16.
- [React Native 0.86 useColorScheme](https://reactnative.dev/docs/0.86/usecolorscheme): subscribes to system appearance; implementing automatic selection is a separate UX choice.
- [Reanimated accessibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/): honor system reduced motion in animation behavior.

## Completion language

Mark each native batch complete only after its deliverables exist. Record a concise verification note. Keep physical Android review pending until the user checks it; browser approval and code inspection do not stand in for that. RN-00 prepared assets, RN-01 implemented theme/font loading, RN-02 migrated shared controls/tabs, RN-03 transferred Talk, RN-04 transferred Activities library, RN-05 transferred Journal and its supporting views, RN-06 migrated saved outputs/shared activity chrome, RN-07 carried the foundation through Brain Dump, RN-08 transferred Unsent Letter, RN-09 transferred Notice & Name, RN-10 transferred One Small Step, RN-11 transferred Reach Out, RN-12 transferred Move Scene, RN-13 transferred One Song, RN-14 transferred Grounding, RN-15 transferred Paced Breathing, and RN-16 finished the global theme pass. Android device review remains pending. EAS builds stay on hold until the user asks to resume them.

## Foundation usage (RN-01)

Converted components import `useTheme` from `components/ui` and read `colors`, `typography`, `paper`, `art`, `wordmark`, and `isDark`. Apply a text role with its intended color; static Nunito aliases encode weight, so the loaded role resets `fontWeight` to normal to avoid synthetic bold. System-font fallback roles retain numeric weights if font loading reports an error. Keep legacy styles from overriding these text roles when migrating a component.

For local preview, the user can choose themes through the Look control on Talk, Activities, Journal home or an activity. The selected theme is stored on device and restored on launch. `setThemeId` updates reactive consumers without changing routes or resetting their data. Android visual verification remains RN-17.
