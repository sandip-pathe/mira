# Mira submission build — work orders

Status: implementation in progress. SUB-01 and SUB-02 source changes are implemented. SUB-03 controls are implemented locally; provider settings and deployment persistence remain pending. SUB-04 now has host-neutral Docker packaging; host selection and deployment remain pending. No deployment, account creation, or build has been performed.
Date: 31 October 2026.
Submission target: Bolna Symphony Buildathon; directly installable standalone Android APK, plus a recorded pitch and stable project link.

Execute one work order at a time after its decisions are settled. Start an EAS/native build only when Sandy explicitly requests it. Keep the development profile for ongoing development; the reviewer APK must work without Metro or Sandy's computer.

## Current gaps

| Area | Evidence in the repository | Submission consequence |
| --- | --- | --- |
| Hosting | Root Docker packaging is prepared; no host is selected, and `expo.extra.apiUrl` is empty | Need stable HTTPS, persistent `/data`, provider secrets, and a hosted API before the standalone APK |
| Auth | Branded existing-account Firebase sign-in and backend reviewer UID/deadline gate exist in source; reviewer accounts/configuration are pending | Provision accounts, set the allowlist/access window, and deliver credentials privately |
| Paid access | Reviewer-mode gate is implemented; it is disabled in local defaults until configured | Enable reviewer mode and verify an unapproved UID is denied |
| Spend | Durable global OpenAI reservation ledger and per-user limits exist in source; OpenAI/Bolna provider settings and persistent deployment volume remain pending | Configure the provider backstop and verify review-mode exhaustion behavior |
| Direct voice | Reviewer mode blocks direct OpenAI Realtime/transcription; Bolna mints are limited, but its hosted five-minute termination setting is unverified | Save and verify the Bolna call-duration setting; document active-session termination limits |
| Startup | Icon, native splash configuration, and first-use flow are implemented in source | Inspect final release APK appearance and startup behavior |
| Native behavior | Earlier native compilation passed; latest call, speaker, and standalone behavior remain unverified | Final reviewer artifact needs a small phone walkthrough |
| Audio crossover | OpenAI Talk and Bolna have separate WebRTC connections and shared Android audio routing | Full coordination stays deferred, but choose how the submission exposes the two modes |
| Package | README is primarily developer setup; pitch/APK/reviewer entry links are not assembled | Need a reviewer-facing handoff |

## Recommended decisions

- Confirmed: the global OpenAI API budget is **US$20 total across all reviewers and all OpenAI-backed features for the submission review window**, not $20 per account or per day. This covers text, Realtime voice, transcription, and supporting model/tool requests billed to our OpenAI project. It is an API budget, separate from a ChatGPT subscription. Bolna charges need a separate budget decision.
- Confirmed: use invited reviewer accounts and share dedicated app credentials privately with the judging instructions. Do not share a personal account, provider key, or credentials in the APK/public README. Prefer separate reviewer accounts where practical; a shared account shares its allowance.
- Sign-in presentation: use the normal branded Mira sign-in screen, with password visibility, autofill support, readable errors, and a short note that review access is supplied with the submission. Keep account creation out of this submission. Do not embed credentials or add an automatic paid guest session merely to simplify entry.
- Deck and video: Sandy is preparing both. Our remaining responsibility is app/package readiness and checking the final links when supplied.
- Keep public registration deferred. If open signup is chosen, registration must be paired with invite approval or a strictly bounded trial before any paid endpoint becomes available. A Register button by itself provides no spending protection.
- Build a signed release-mode APK for direct download. Google Play/AAB publication is a separate later path.
- Use the existing Mira visual identity after reviewing the actual assets. Plan one short, skippable introduction, not a long onboarding tour.
- Keep full WebRTC crossover work in `TODOS.md`. Before the final APK, explicitly choose: retain both voice modes with minimum mutual-exclusion gating, or expose only one voice mode in the submission variant. Recommended primary experience: Bolna calling plus text; retaining hold-to-talk is a product decision. No feature is removed by this plan.
- Keep the video/project links ready independently of APK availability. The event currently lists submission on 31 October and does not publish a cutoff time on the reviewed page; do not let build preparation consume the submission window.

## SUB-00 — Freeze the submission experience and review gaps

1. Confirm the exact story: open Mira → sign in → Call Mira → have one useful conversation → explore an Action or Journal. Calling currently receives a bounded context snapshot; it does not launch activities or import call transcripts into Talk. Show those as separate capabilities unless later work explicitly adds a handoff.
2. Choose which voice modes reviewers can use and record the crossover disposition. Do not imply the deferred automatic handoff already works.
3. Review only the release-critical paths: sign-in, credential minting, microphone/audio cleanup, call cancellation/retry, latest speaker routing, local save/reopen, and account sign-out/reset.
4. Check native dependencies/config plugins, required permissions, bundled activity assets, public API origin, and accidental secret inclusion. Review output should list concrete blockers, deferrals, and owners; avoid a broad cleanup campaign.
5. Record the exact source revision and intended feature set for the final artifact.

Done when: a short blocker list and submission feature list are agreed. Existing feature claims distinguish source implementation, web proof, native compilation, and actual phone use.

## SUB-01 — App identity, startup, and first use

1. Review the existing Mira mark at launcher size; choose the final app icon, Android adaptive foreground/background, and monochrome icon. Check masking and readable contrast.
2. Configure the matching native splash: Mira mark, app background, no artificial wait. Keep it visible until local startup state is ready, with a defined fallback if font/theme initialization fails. A remote API call must not hold startup indefinitely.
3. Finish loading states for sign-in, connection setup, and paid requests so a waiting screen explains what is happening. Distinguish loading, offline, denied permission, and exhausted allowance.
4. Draft one optional first-use introduction: what Mira offers, Call vs hold-to-talk if both ship, Journal stays on this device, and how microphone capture starts/stops. Explain the review allowance plainly. Ask microphone permission at the relevant action, not on launch.
5. Include Skip/Get started and a later way to reopen the guide. Keep profile questions and extra onboarding steps out unless separately chosen.

Done when: the complete first-run sequence and visual assets are approved. Native splash appearance is checked in the final release APK, since a development build is not a faithful splash preview.

## SUB-02 — Reviewer authentication and access

Implementation note: the app now has a branded existing-account sign-in with password visibility and autofill. The backend can require a reviewer UID allowlist and UTC access deadline before any worker endpoint; local development keeps this gate disabled. Provisioned reviewer accounts, the actual UID list/deadline, private credential delivery, and reviewer walkthrough remain pending.

1. Use the confirmed dedicated existing-account sign-in, with no public Register button. Apply the branded sign-in presentation above; reviewer credentials belong in the private access instructions.
2. Provision reviewer Firebase accounts and a backend UID allowlist with an explicit access window. Do not assume hiding registration prevents someone from creating a Firebase account through its public client API.
3. Check both authentication and reviewer authorization before every paid worker/session-mint request. Provide a readable denied/expired-access state.
4. Prepare private credentials, password reset/replacement instructions, and a contact for failed access. Choose an access window covering actual judging; do not disable accounts immediately after submitting.
5. Review fresh install, persisted sign-in, invalid password, sign-out, and local data separation on a shared device.

Done when: a reviewer can sign in without developer help, and an unapproved UID cannot reach paid features. Firebase Admin supports creating/disabling dedicated accounts; the backend allowlist remains the access decision for paid workers.

## SUB-03 — Bound credit exposure

Implementation note: review-mode OpenAI Responses calls now reserve against the cumulative $20 cap in a durable SQLite ledger and settle from provider usage; unknown outcomes retain the reservation. Reviewer accounts are limited to 50 model-backed API operations/day; Bolna minting is limited to 3/day/account with a 60-second cooldown. Direct OpenAI Realtime and Brain Dump transcription are disabled when reviewer access is required because the issued credential cannot enforce a server-side duration or usage cap. Local development remains unchanged. The Bolna agent JSON now requests a 300-second call maximum, but that value still must be saved in Bolna and verified for web calls. Before submission, mount persistent storage for the SQLite file and set the OpenAI project hard limit/alerts. A dollar-per-day allocation and Bolna dollar budget remain undecided until reviewer count and access window are chosen.

1. Enforce the confirmed **US$20 cumulative global OpenAI review budget**, shared across accounts and OpenAI features. Keep its ledger across restarts and calendar-month changes; no automatic reset/refill during the review window. Choose a daily allocation within that total, reviewer count, and review window. Bolna's separate budget remains undecided.
2. Draft starter allowances for discussion: 3 Bolna calls/day/account, at most 5 minutes each; 50 AI text/assistance operations/day/account; one paid live voice session per account. If OpenAI Realtime and Brain Dump speech ship, give them explicit separate session/usage allowances too. These are proposals, not current limits.
3. Persist atomic usage reservations on the backend so restarts, parallel requests, retries, or multiple devices cannot reset/bypass allowances. Reserve before minting credentials; release/refund only when failure or actual usage is verified. Cover every billable endpoint and internal provider/tool fan-out.
4. Apply server-controlled model/output/input bounds and session-mint cooldowns. Set provider-enforced call duration where supported and verify it applies to Bolna web calls. An idle timeout is additional protection, not the total duration limit.
5. Resolve direct OpenAI voice exposure explicitly. A short-lived credential only limits when a connection can start. A client countdown is UX, not a trusted cap. Use verified provider/server enforcement or reserve a conservative provider maximum session cost and constrain new sessions. Do not promise hard minute accounting without enforcement.
6. Isolate submission provider credentials/project where practical. Configure an OpenAI project hard spending limit of US$20 as an additional backstop, with suggested alerts at US$10 and US$15. The application's cumulative budget must still cover the full review window, since a monthly provider cap can reset. Reserve headroom for in-flight sessions and enforcement overshoot; do not promise an exact zero-overshoot ceiling. Verify Bolna's available controls rather than assume they exist.
7. Add a backend switch to stop new paid operations and revoke evaluator authorization. Document that stopping new sessions does not necessarily terminate an already active provider connection; use provider termination controls where available.
8. Show a clear allowance-reached state, reset time, and how reviewers can request more. Keep local Journal/Actions usable. Keep operational records limited to UID, counts, session identifiers, timestamps, and usage needed for these controls.

Done when: unapproved access, repeated minting, concurrency, restart behavior, exhausted allowance, and provider failures have concrete outcomes. The residual worst-case spend of already active sessions is understood.

## SUB-04 — Host the backend independently

Implementation note: root `Dockerfile` and `.dockerignore` package FastAPI, its dependencies, and the shared activity catalog without environment files. The image uses one Uvicorn worker and stores the budget ledger at `/data/review-budget.sqlite3`; the selected host must mount persistent storage at `/data`. Host choice and live deployment are still pending.

1. Select a host with stable HTTPS, outbound access to Firebase/OpenAI/Bolna, and persistent storage for allowances. Choose service size and sleeping/always-on behavior for the review window.
2. Package FastAPI with its Python dependencies and the bundled catalog at the paths the server expects. Put provider secrets only in the host's secret settings; match the Firebase project.
3. Keep one process/replica while existing transient voice-relay state is in memory, unless that state is moved to shared storage. Durable quota data alone does not make all worker state multi-replica safe.
4. Set health checks, restart behavior, sanitized error logs, and the paid-feature switch. Confirm a backend restart preserves quota reservations.
5. Configure the submission APK's public HTTPS API origin. Confirm phone requests bypass Metro entirely.

Done when: the service works with the Windows server and Metro stopped. Hosting implementation/deployment requires a later work order; none is done here.

## SUB-05 — Prepare the Android submission profile

1. Add a clearly named `submission` EAS profile: internal distribution, APK output, release mode, embedded JS/assets, no development client. Keep the existing development profile separate.
2. Set the hosted API URL via the chosen build environment/configuration. Keep OpenAI/Bolna secrets out of every `EXPO_PUBLIC_*` value and app bundle.
3. Confirm `com.sandi.mira`, display name, version/versionCode, signing key continuity, final icons/splash, Android permissions, foreground call service, notification actions, deep links, and backup rules. Inspect the release permission set; omit unused camera/overlay permissions where not required.
4. Review `.easignore` so config plugins and their native Java files are included, while secrets, caches, and local generated Android projects are excluded as intended.
5. Complete only the focused checks needed for the final changes and Android release bundle/native integration. Record results once; do not rerun broad suites after documentation or asset-only changes without reason.

Done when: the profile and source snapshot are ready for a build, all blocker decisions are resolved, and Sandy has the concrete build proposal to authorize.

## SUB-06 — Build only after explicit instruction

Planned command, not executed:

```powershell
cd mobile
npx eas-cli@latest build --platform android --profile submission
```

EAS signs and produces the directly installable APK. Record build ID, version, source revision, backend origin, and APK download URL. An AAB is the later Google Play artifact; it is not the direct-download handoff proposed here.

Done when: the requested build succeeds and the exact APK is available. No automatic rebuild loop.

## SUB-07 — One short final phone walkthrough

1. Install the exact submission APK on the OnePlus; record Android version. Stop Metro and the local FastAPI service to prove independence.
2. Cold launch → splash → introduction → sign in using reviewer credentials.
3. Place one real Bolna call, speak and interrupt, mute, use the chosen route, briefly background/lock and return through the notification, then hang up. Confirm microphone/notification cleanup.
4. Send one text reply, save/reopen one Journal entry, and run one Action. If hold-to-talk or Brain Dump speech ships, exercise it once, including Talk speaker output and the chosen crossover restriction.
5. Check denied microphone permission, one network failure, and an exhausted allowance with controlled settings. Confirm a clear recovery path and usable local content.

Done when: one concise pass/fail note exists. Only observed failures trigger fixes and a possible explicitly requested replacement build. Do not claim untested behavior based on web audio or compilation.

## SUB-08 — Assemble and hand over the submission

1. Prepare a stable reviewer page/README with APK link, installation steps, Android support notes, a short feature guide, backend availability window, known limitations, and a contact. Share app credentials privately with reviewers where possible.
2. Record a short real-phone video with audible Mira speech; explain separate capabilities honestly and show one useful outcome. Keep this accessible even if APK installation or network access fails.
3. Sandy is preparing the deck and video. Once ready, upload the chosen pitch asset to Google Drive or Luma with link access and check it. The current official form asks for this in addition to a submission link, project description, and team/registration details.
4. Check the public asset links signed out, including video sound and download access. Keep the reviewer credential delivery separate from the public project page.
5. Submit only on Sandy's explicit instruction and retain confirmation. Keep hosting and review access alive through the chosen window; review spend and extend access for follow-up interviews if needed.

Done when: the submitted links and confirmation are recorded, reviewers can access the material, and the agreed hosting/credit window has an owner.

## Decisions to settle before implementation

1. Reviewer-only accounts are confirmed; settle reviewer count and private credential delivery.
2. Retain both voice modes with minimum gating, or choose the submission's primary voice mode while full crossover work stays deferred?
3. Final logo from existing assets or a new direction? One-screen onboarding proposed above acceptable?
4. Hosting choice, separate Bolna budget, daily allocation within the confirmed US$20 total OpenAI budget, and access window?

## Sources

- Existing event research: [Bolna submission plan](../docs/bolna-buildathon-submission-plan.md).
- [Official event timeline](https://www.bolna.ai/symphony/buildathon) and [submission fields](https://www.bolna.ai/symphony/buildathon/submit), rechecked 31 October 2026. An APK is our chosen reviewer handoff, not a published requirement in that form.
- [Expo APK builds](https://docs.expo.dev/build-reference/apk/): APK configuration and direct installation.
- [Expo SDK 57 splash screen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/): native configuration and release-build preview limitation.
- [Firebase account management](https://firebase.google.com/docs/auth/admin/manage-users): provisioning and disabling reviewer accounts.
- [OpenAI spend limits](https://developers.openai.com/api/docs/guides/spend-limits): alerts, hard enforcement, and possible overshoot. Bolna enforcement details remain an implementation-time verification item.
