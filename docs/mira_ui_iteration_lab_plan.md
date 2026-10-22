# Mira UI Iteration Lab Plan

## Recommendation

Create a small, independent **Vite + React + TypeScript + HTML/CSS** project beside the Mira repository (for example, `C:\y\mira-ui-lab`). Use it to explore screen layouts, illustrations, motion, and interaction flow in a desktop browser at phone-sized viewports. Keep Expo/React Native as the shipping app.

This gives UI experiments browser hot reload without starting the Expo app or pulling in its native dependency graph. It is a visual prototyping environment, not a second implementation of Mira's production logic.

## Options

| Option | Use | Tradeoff |
| --- | --- | --- |
| **Standalone Vite UI Lab (recommended)** | Rapid visual and interaction experiments | UI is HTML/CSS; approved designs must be implemented and checked in React Native |
| Expo Web | Quick preview of code already built from compatible React Native components | Still uses Expo/Metro and React Native Web; native-only modules and platform differences can limit previews |
| Figma | Early static composition and visual direction | Does not exercise working transitions or realistic responsive layouts |

Expo supports web through React Native Web, but web and native have platform-specific behavior. An independent DOM-based lab best isolates fast experiments from the mobile app's startup and native package constraints. See [Expo's web workflow](https://docs.expo.dev/workflow/web/), [platform differences](https://docs.expo.dev/tutorial/platform-differences/), and [Expo's FAQ on React Native versus HTML](https://docs.expo.dev/faq/).

## Project boundary

- Create an isolated `ui-lab/` project with its own `package.json`, lockfile, Vite config, and run command. Do not place it under `mobile/` or import app source files into it.
- Do not add dependencies, scripts, or prototype routes to the Mira app as part of establishing the lab.
- Manually mirror only the small set of approved visual tokens (colors, type scale, spacing, radii) needed for prototypes. The current palette in `mobile/src/components/ui/tokens.ts` is a starting reference, not a runtime dependency.
- Match the app's installed typeface and icon set when practical, and copy only the static font/glyph assets needed into the lab. Keep sizing and visual references explicit so browser prototypes remain recognizable without importing mobile code.
- Use original, copied, or lab-specific static illustrations. Keep generated/exported assets in the lab until they are intentionally adopted into the app.
- Do not connect to Mira's API, use real account data, or reproduce backend/business logic. Use deterministic mock content and local in-memory state.
- Treat the Expo app and approved product documents as the source of truth for behavior. The lab is disposable and may diverge while exploring.

## What to prototype

Build the lab around complete, switchable screens rather than recreating the app shell first:

1. **Talk:** welcome/presence hero, mascot placement, listening/retry states, and call controls.
2. **Activities:** library, distinct activity experiences, activity prompts, overlays, and completion moments.
3. **Journal:** home/recent entries, new-entry path, and editor as separate screens.
4. **Activity outputs:** review/list/detail views for created content, with fake records.
5. **One end-to-end sample flow:** Talk suggestion → selected activity → completed result → result detail/feedback.

Support a few phone viewport presets and a resizable viewport. Make mock navigation and interactions real enough to expose layout problems: open/close sheets, switch states, type in fields, advance/cancel flows, and view sample saved outputs. Avoid implementing persistence or AI in the lab.

## Implementation sequence

### Lab 0 — Agree the boundary

Keep this project in the isolated `ui-lab/` directory. Confirm its purpose, ownership, and mock-only data rule in its README.

**Done when:** it has no dependency or source-code link to `mobile/`, and starting it cannot alter or build the app.

### Lab 1 — Minimal browser shell

Scaffold Vite + React + TypeScript with a small CSS token file, screen selector, phone viewport frame, and mock-data module. Use standard CSS and inline SVG where useful; add a component or animation library only if a concrete prototype needs it.

**Done when:** the dev server opens directly to a working screen and edits update in the browser without an Expo or Android build. **Complete:** `ui-lab/` runs with Vite and React.

### Lab 2 — Fast visual exploration

Prototype Talk's hero and controls first, then the Activities and Journal screen compositions. Try alternate layouts, illustrations, and CSS/SVG motion without polishing the shipping implementation prematurely.

**Done when:** the screens are directly editable and hot reload at phone sizes. **Complete:** Talk, all nine Activities, and Journal are prototyped at the requested 75% preview scale, with a CSS breathing animation and local sample interactions.

### Lab 3 — Exercise the activity flow

Connect the mock screens through simple local navigation and deterministic data. Include empty, active, completed, and error/connection presentations where they affect the design.

**Done when:** the sample flow can be clicked through from Talk to a completed activity output, with no server calls. **Complete:** Talk offers One Small Step in the sample text exchange; activities can be completed and saved work can be reopened in the local prototype.

### Lab 4 — Select and transfer

Capture the approved screen states and note intended spacing, typography, assets, animation, and state changes. Port selected work into the native app using its React Native components and current dependencies. Keep native navigation, keyboard, safe areas, gestures, audio, and module behavior native.

**Done when:** the approved iteration is implemented in Expo and checked on the OnePlus/device target. Browser appearance alone does not count as native verification.

## Working loop

1. Start the lab's Vite server and iterate in a browser.
2. Try a specific screen or interaction and compare variants at phone dimensions.
3. Keep or discard the experiment; record every accepted design decision and its concrete mobile handoff in [the UI decision log](mira_ui_decisions.md).
4. Port accepted decisions to the app, update their status in the log, and verify device-specific behavior there.

The lab avoids waiting for native builds during visual exploration. It cannot remove the final device-check step: HTML/CSS layout, browser fonts, keyboard behavior, safe areas, and native components can differ. Expo development builds also bundle native modules that must exist in the installed app, so the lab should not try to stand in for that runtime ([Expo development build FAQ](https://docs.expo.dev/develop/development-builds/faq/)).

## Out of scope

- Rewriting Mira as a web app or replacing Expo/React Native.
- Sharing application logic or production state between the lab and mobile app.
- Real API calls, private user data, AI behavior, authentication, offline storage, or release builds.
- Treating a browser prototype as proof that native behavior is correct.
