# Mira — Bolna Symphony Buildathon submission plan

Research date: 30 October 2026 (Asia/Calcutta). This document covers the event and submission package. Provider migration and implementation are separate.

Android reviewer packaging, access, credit controls, branding, hosting, and build sequencing are planned in the [submission build work orders](../PRD/mira_submission_build_work_orders.md). That plan does not authorize implementation or a build.

## Official sources

- Event and FAQ: https://www.bolna.ai/symphony/buildathon
- Submission: https://www.bolna.ai/symphony/buildathon/submit
- FAQ implementation served by the official site: https://www.bolna.ai/symphony/buildathon/assets/routes-BQo9TEUs.js
- Submission form implementation: https://www.bolna.ai/symphony/buildathon/assets/submit-SSEqODD3.js
- Credits request linked by the event: https://docs.google.com/forms/d/e/1FAIpQLSfEv13TUXouL2DzgGGt9MDYVu0459QDb3ETt9rNt3leDtHJlA/viewform
- Community: https://www.bolna.ai/join-slack
- Organizer contact published on the Symphony page: symphony@bolna.ai

## Confirmed event facts

| Item | Published information |
| --- | --- |
| Submission deadline | 31 October 2026; no cutoff time/timezone published on the reviewed page |
| Shortlist notification | 3 November, by email |
| Interviews | 5–7 November |
| Finalist announcement | 8 November |
| Finale | 20 November, Abhyas Hall, The Lalit Ashok, Bengaluru |
| Format | Virtual until the top-three finale; their travel is covered |
| Team | Solo or up to four people |
| Entrants | Students, professionals, indie builders |
| Eligible product | A product with voice, including a voice feature added to an existing product |
| Tracks | None |
| Prizes | First ₹50,000 plus YC interview; second ₹40,000; third ₹30,000 |
| Additional benefit | Top ten teams receive Symphony tickets |

The YC prize is an interview, not acceptance or investment. The finale date is not the project submission deadline. Submit today or early tomorrow rather than assuming an unpublished midnight cutoff.

## Rubric and unanswered requirements

No scoring rubric, numerical weights, pitch duration, slide count, public-source requirement, or mandatory Bolna-integration requirement was found in the official event page, FAQ, or submission form. Their selection description says they review applications and shortlist the strongest builds. Treat these items as unspecified, rather than inventing contest rules.

Useful organizer questions, if needed: exact deadline time/timezone; whether Bolna use is compulsory; whether a demo recording is sufficient for initial review; judging dimensions and weights. No message has been sent.

## Required submission fields

- Team size; team name additionally required when there is more than one person.
- Full name and the same email used to register. The current form checks for a matching registration.
- Project name.
- Description: 1–2 lines, at most 200 characters.
- Submission link: HTTP(S) GitHub repository, live app, or demo link.
- Pitch deck OR pitch video link: Google Drive or Luma; sharing must allow anyone with the link.

The current form validates Drive/Luma for the pitch field. It says Luma, not Loom. No published duration or deck-length limit was found. A hosted standalone app and APK are not listed as mandatory submission artifacts.

## Suggested form copy

Project name: Mira

Description (under 200 characters):

> Mira is a voice-first wellbeing companion for people feeling overwhelmed. Talk through a difficult moment, choose one small action, and keep a private journal.

Team size, full name, and registered email: use the participant's actual details; do not infer them.

Submission link: the actual repository or a stable demo page with a clear entry point.

Pitch link: an accessible Google Drive video file, with the optional PDF deck linked alongside it from the repository/demo page.

## Recommended package — our recommendations, not event mandates

1. A short recorded demo with audible app speech and the real phone UI. Lead with one user and one situation; show the voice conversation producing one useful next step. A recommended length is 2–3 minutes.
2. A six-slide PDF deck: person/problem; Mira experience; working demonstration; differentiation; what exists and what was added for this event; evidence, team, and next step. Use only actual user feedback, usage, and implementation claims.
3. A clear project README/demo page: one-sentence pitch, video link, screenshots, how to run/try it, current working features, limitations, and a brief distinction between earlier work and event additions.
4. A stable submission link and a separate pitch link. A temporary Metro tunnel should not be the only way a reviewer can understand the submission.
5. An access check from a signed-out browser: both links open without an access request; the video plays with sound; the repository/demo page identifies the project and explains how to try it.

## Mira's event story

Recommended narrative: someone feels overwhelmed, speaks naturally to Mira, understands the situation a little better, chooses one manageable action, and can reflect privately afterward. Demonstrate that full path rather than touring every screen.

The existing voice component fits the published product category in principle. In-app calls could strengthen the experience if they improve this story, but the event does not publish a requirement to add calling or evidence of extra points for it. Discuss implementation and provider choices separately.

Suggested preparation lens (not an official scoring rubric):

| Question | Evidence to show |
| --- | --- |
| Who needs this? | One concrete user and moment |
| Why voice? | A task that is easier through speaking/listening |
| Does it work? | An uninterrupted real interaction and useful result |
| What is distinctive? | The transition from conversation to a small action and reflection |
| Can the builder explain it? | Clear boundaries, truthful feature claims, and a credible next step |

## Submission sequence

- Confirm the registration email and actual team details.
- Finalize the demo story and record the working flow.
- Prepare the optional PDF deck and a clear README/demo page.
- Put the pitch asset on Drive with the required sharing setting.
- Enter the two stable links and the short description in the official form.
- Submit before the published date expires; retain the confirmation. This document does not submit or register anything.
