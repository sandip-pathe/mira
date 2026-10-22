# Selected A assets and motion

Mode: builtin image generation; new pose sheet generated 2026-10-21 using A’s existing illustration as a style and character reference. No CLI/API generation. Copied unchanged into the project, preserving transparent alpha. The original reference plate is retained.

Project asset: [assets/mascot-poses.png](assets/mascot-poses.png), 2172 × 724 RGBA. Original: `C:/Users/sandi/.codex/generated_images/01a1510c-d958-7852-b921-41a7cd1c26b3/exec-cb89c513-2fbb-4fa7-8d91-ee30da6d645d.png`.

The welcome hero, Activities motif and Journal book use [the unchanged original A plate](../step-04/assets/illustrations/a-plate.png). Its [generation prompts](../step-04/artwork-provenance.md) remain recorded. `Art` selects an SVG viewBox region, preserving proportions; it does not modify the PNG.

| State | Region / motion | Interruption |
| --- | --- | --- |
| Welcome / ready | Original hero; optional 6s, 3px float | Motion toggle or reduced-motion stops the loop |
| Holding | Pose sheet x=0, width=724; small attentive lean; static control ring | Pointer release sends; pointer cancel, blur or leaving cancels without sending |
| Waiting | Pose x=724, width=724; still thoughtful pose; distinct three-dot indicator | New hold, mode switch or leaving replaces the pending sequence |
| Reply | Pose x=1448, width=724; 2s, 3px gentle nod; 900ms level-mark variation | Hold interrupts immediately; leaving ends the sequence |
| Retry / voice off | Calm original hero; accurate state title | Explicit hold or text entry is required |
| Journal blank | Small book illustration; no ambient loop | Disappears when writing or saved entries take priority |
| Press | Existing immediate scale feedback, 180ms hero transform / 160ms opacity transitions | Input never waits for an animation-end callback |
| Reduced motion | No animation or transition; still poses and state labels | Same controls, content and flow |

Browser timings simulate processing (~850ms), a spoken reply (~2200ms), local Journal save (~450ms), and follow-up (~900ms). These delays exist to inspect pending and failure layouts; they are not measured backend/native latency. No microphone, audio playback, model request or haptic event is invoked. Off-screen ambient loops are paused. The image sheets are preloaded to avoid empty art between states.

## Exact pose-sheet prompt

Create a new matching pose sheet for Mira's selected Little company mascot. Reference image: use ONLY the moss-green seated sprout companion on the LEFT as the character identity and tactile clay style reference; ignore the note and book in the other regions. Generate a wide 3:1 transparent PNG triptych with three equal square zones, generous transparent margin, each complete subject inside its own third. Same single character in all three: moss-olive rounded seed body, cream face, tiny dark eyes, warm peach cheeks, quiet little smile, two tender leaves on head, stubby arms and feet, resting on a low irregular pale peach clay pebble. Preserve its likeness, proportions, matte grain, warm studio lighting, adult tasteful charm. Left pose: listening attentively, slight head lean, hands relaxed, open eyes, no hand cupped to ear. Middle pose: thoughtfully waiting, neutral warm face with eyes gently lowered, tiny hands resting together. Right pose: gently speaking with one small open palm gesture and a subtle open smile, no exaggerated excitement. No text, letters, speech bubbles, UI, borders, numbers, badges, sparkles or divider lines. Truly transparent alpha background, no background scene. Polished mobile illustration asset, no cropping or subject overlaps between zones.
