# Mira submission build — work orders

Status: implementation in progress. SUB-01 first-use flow, padded launcher, and branded Firebase sign-in/registration UI are implemented. Direct HTTPS hosting and the submission EAS profile are configured; Firebase email/password sign-in is enabled. Final APK verification and the requested-deferred phone walkthrough remain pending. Reviewer allowlisting, app-level usage quotas, and the billing ledger were removed by decision. No APK build has been performed.
Date: 1 November 2026.
Submission target: Bolna Symphony Buildathon; directly installable standalone Android APK, plus a recorded pitch and stable project link.

Execute one work order at a time after its decisions are settled. Start an EAS/native build only when Sandy explicitly requests it. Keep the development profile for ongoing development; the reviewer APK must work without Metro or Sandy's computer.

## Current gaps

| Area | Evidence in the repository | Submission consequence |
| --- | --- | --- |
| Hosting | EC2 worker is healthy over HTTPS at `https://3.104.124.56`; external `/health` returns 200 and the IP certificate validates | Keep the instance running for review; Certbot renews the short-lived certificate and restarts the API to load it |
| Auth | Branded Firebase sign-in/registration, server ID-token verification, and project match; Firebase returned the expected invalid-credentials response for a non-existent account | Exercise registration/sign-in once in the final APK if device QA is resumed |
| Paid access | UID allowlist and reviewer expiry gate were removed | Firebase-authenticated users can use paid features; monitor provider dashboards |
| Spend | Application billing ledger and per-account call/usage quotas were removed | Provider usage bills directly to the configured OpenAI and Bolna accounts; monitor their dashboards |
| Direct voice | OpenAI and Bolna report configured on the hosted health check; worker endpoints reject unauthenticated calls | Use Firebase sign-in before paid voice/text features |
| Startup | First-use flow and Mira launcher/splash artwork paths resolve. Launcher foreground now has transparent padding; themed monochrome icon is intentionally skipped as optional. | Inspect launcher icon, splash appearance, and launch behavior in the final release APK |
| Native behavior | Earlier native compilation passed; latest call, speaker, and standalone behavior remain unverified | Final reviewer artifact needs a small phone walkthrough |
| Audio crossover | Talk closes its Realtime connection before starting Call Mira; ending Call Mira releases its media and returns to Talk in text mode, with voice resuming only on user action | Source flow is sequential; native audio handoff remains unverified because device testing is deferred |
| Package | README is primarily developer setup; pitch/APK/reviewer entry links are not assembled | Need a reviewer-facing handoff |

## Recommended decisions

- Superseded: the app no longer enforces the previously proposed US$20 global OpenAI cap or per-user usage limits. OpenAI and Bolna usage is charged through their provider accounts.
- Confirmed: allow reviewers to create Firebase email/password accounts in Mira. Keep provider keys on the backend. No UID allowlist or separate reviewer provisioning workflow.
- Sign-in presentation: use a branded Mira sign-in/register screen, with password visibility, autofill support, readable errors, and keyboard-aware scrolling. Do not embed shared credentials or add an automatic paid guest session.
- Deck and video: Sandy is preparing both. Our remaining responsibility is app/package readiness and checking the final links when supplied.
- Keep Firebase Email/Password sign-in and account creation enabled; no UID allowlist or separate reviewer provisioning workflow.
- Build a signed release-mode APK for direct download. Google Play/AAB publication is a separate later path.
- Use the existing Mira visual identity after reviewing the actual assets. Plan one short, skippable introduction, not a long onboarding tour.
- Keep both Talk hold-to-talk and Call Mira in the submission. Use one active voice connection at a time: close the current WebRTC/audio session before starting the other, show a clear reconnecting state, and preserve text history. A brief reconnect delay is acceptable; simultaneous sessions and automatic handoff are out of scope.
- Keep the video/project links ready independently of APK availability. The event currently lists submission on 31 October and does not publish a cutoff time on the reviewed page; do not let build preparation consume the submission window.

## SUB-00 — Freeze the submission experience and review gaps

1. Confirm the exact story: open Mira → sign in → Call Mira → have one useful conversation → explore an Action or Journal. Calling currently receives a bounded context snapshot; it does not launch activities or import call transcripts into Talk. Show those as separate capabilities unless later work explicitly adds a handoff.
2. Keep Talk voice and Call Mira available to reviewers. Switching modes ends the active WebRTC/audio session, shows a reconnecting state, then starts the selected mode; a reconnect delay is acceptable. Preserve the text conversation. Do not imply simultaneous voice sessions or automatic handoff.
3. Review only the release-critical paths: sign-in, credential minting, microphone/audio cleanup, call cancellation/retry, latest speaker routing, local save/reopen, and account sign-out/reset.
4. Check native dependencies/config plugins, required permissions, bundled activity assets, public API origin, and accidental secret inclusion. Review output should list concrete blockers, deferrals, and owners; avoid a broad cleanup campaign.
5. Record the exact source revision and intended feature set for the final artifact.

Done when: a short blocker list and submission feature list are agreed. Existing feature claims distinguish source implementation, web proof, native compilation, and actual phone use.

## SUB-01 — App identity, startup, and first use

Implementation note: the skippable two-page welcome flow explains Mira, Talk versus Call Mira, on-device Journal entries, microphone behavior, and account sign-in/creation; it can be reopened from Journal. The launcher uses a padded transparent foreground PNG; original Mira art remains the light/dark splash image. The Android themed monochrome icon is intentionally skipped as optional. Final visual verification of launcher and splash remains pending in the signed release APK.

1. Review the Mira mark at launcher size; use the padded foreground and warm adaptive background. The optional themed monochrome icon is deferred. Check masking and readable contrast in the final APK.
2. Configure the matching native splash: Mira mark, app background, no artificial wait. Keep it visible until local startup state is ready, with a defined fallback if font/theme initialization fails. A remote API call must not hold startup indefinitely.
3. Finish loading states for sign-in and connection setup. Distinguish loading, offline, and denied permission.
4. Draft one optional first-use introduction: what Mira offers, Call vs hold-to-talk, Journal stays on this device, and how microphone capture starts/stops. Ask microphone permission at the relevant action, not on launch.
5. Include Skip/Get started and a later way to reopen the guide. Keep profile questions and extra onboarding steps out unless separately chosen.

Done when: the complete first-run sequence and visual assets are approved. Native splash appearance is checked in the final release APK, since a development build is not a faithful splash preview.

## SUB-02 — Reviewer authentication and access

Implementation note: the app has branded Firebase email/password sign-in and registration with password visibility, autofill, and keyboard-aware scrolling. The backend verifies Firebase ID tokens but does not check a reviewer UID allowlist or deadline.

1. Keep Firebase Email/Password authentication enabled so users can register and sign in from the branded screen.
2. Keep server-side Firebase ID-token verification for every worker/session-mint request.
3. Provide clear error messages for duplicate email, weak password, invalid credentials, and connectivity failures.
4. Review fresh install, registration, persisted sign-in, invalid password, sign-out, and local data separation on a shared device.

Done when: a user can register or sign in, authenticated requests work, and the backend rejects requests without a valid Firebase ID token.

## SUB-03 — Keep provider billing simple

Implementation note: the app-side OpenAI budget ledger, daily OpenAI operation limit, Bolna daily call limit/cooldown, and reviewer-only voice restrictions have been removed. Paid API use requires a valid Firebase sign-in and is billed to the configured OpenAI or Bolna provider account. Basic request-rate throttles remain to prevent accidental request loops; they are not daily spend allowances.

1. Keep provider credentials on the server and use the existing provider accounts.
2. Check current usage and billing in the OpenAI and Bolna dashboards; do not promise an app-enforced dollar or call ceiling.
3. Keep the global paid-operation pause switch available for an operational outage.

Done when: signed-in reviewers can use text, Talk voice, and Call Mira without app-level billing or daily usage caps, and usage is visible in the provider dashboards.

## SUB-04 — Host the backend independently

Implementation note: root `Dockerfile` and `.dockerignore` package FastAPI, its dependencies, and the shared activity catalog without environment files or local virtualenvs. On 1 November 2026, the current backend source was rebuilt and redeployed on the existing EC2 instance as `mira-api:redeploy-20261101`. It serves HTTPS directly on port 443 at `https://3.104.124.56`; external `/health` returned 200 with OpenAI and Bolna configured, and Docker reports healthy. A Let's Encrypt IP certificate is installed; Certbot's scheduled renewal uses a deploy hook to restart the API and load the renewed certificate. HTTP port 80 is open for certificate validation; API port 8000 remains private. The service uses one Uvicorn worker; the usage-ledger database and `/data` mount are not needed. Local run instructions are in the README.

1. Keep the selected EC2 host and direct HTTPS listener on its public IP; retain outbound access to Firebase/OpenAI/Bolna.
2. Package FastAPI with its Python dependencies and the bundled catalog at the paths the server expects. Put provider secrets only in the host's secret settings; match the Firebase project.
3. Keep one process/replica while existing transient voice-relay state is in memory.
4. Set health checks, restart behavior, sanitized error logs, and the paid-feature switch.
5. Configure the submission APK's public HTTPS API origin. Confirm phone requests bypass Metro entirely.

Done when: the service works with the Windows server and Metro stopped, with its direct HTTPS origin verified.

## SUB-05 — Prepare the Android submission profile

Implementation note: the repository-root `.easignore` keeps PRDs, design/source collateral, the deck, backend source, and local tooling in GitHub while excluding them from the EAS upload archive. A prior `eas build:inspect --stage archive` confirmed that the app config, assets, dependency lockfile, and native call plugin sources are retained. The `submission` profile resolves to an internal release APK without the development client. The app uses one build-time API origin; runtime endpoint redirection has been removed. `expo.extra.apiUrl` and the submission profile point to `https://3.104.124.56`, and the endpoint's HTTPS health check passes. The EAS CLI is authenticated as `feat.sandip`, matching the configured owner. Expo config resolution and TypeScript checks pass; no EAS build has been started.

1. Keep the `submission` EAS profile: internal distribution, APK output, release mode, embedded JS/assets, no development client. Keep the existing development profile separate.
2. Keep the hosted API URL at `https://3.104.124.56` in the submission build environment. Keep OpenAI/Bolna secrets out of every `EXPO_PUBLIC_*` value and app bundle.
3. Confirm `com.sandi.mira`, display name, version `1.0.0`/versionCode `2`, existing EAS signing key, final icons/splash, Android permissions, foreground call service, notification actions, deep links, and backup rules. The prior development builds used versionCode 1; camera is blocked from the final manifest and the unused overlay permission has been removed.
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
5. Check denied microphone permission and one network failure. Confirm a clear recovery path and usable local content.

Done when: one concise pass/fail note exists. Only observed failures trigger fixes and a possible explicitly requested replacement build. Do not claim untested behavior based on web audio or compilation.

## SUB-08 — Assemble and hand over the submission

1. Prepare a stable reviewer page/README with APK link, installation steps, Android support notes, a short feature guide, backend availability window, known limitations, and a contact. Share app credentials privately with reviewers where possible.
2. Record a short real-phone video with audible Mira speech; explain separate capabilities honestly and show one useful outcome. Keep this accessible even if APK installation or network access fails.
3. Sandy is preparing the deck and video. Once ready, upload the chosen pitch asset to Google Drive or Luma with link access and check it. The current official form asks for this in addition to a submission link, project description, and team/registration details.
4. Check the public asset links signed out, including video sound and download access. Share the shared app account privately, separate from the public project page.
5. Submit only on Sandy's explicit instruction and retain confirmation. Keep hosting and review access alive through the chosen window; review spend and extend access for follow-up interviews if needed.

Done when: the submitted links and confirmation are recorded, reviewers can access the material, and the agreed hosting/credit window has an owner.

## Confirmed decisions

1. Firebase email/password sign-in and in-app registration are enabled; no shared account or UID allowlist is required.
2. Both Talk voice and Call Mira are retained. Source mode switching closes the active session first; returning from Call Mira opens Talk in text mode until the user resumes voice.
3. The two-page skippable introduction and current Mira launcher/splash artwork are accepted; the optional themed monochrome icon is skipped.
4. Direct HTTPS on the EC2 public IP is configured for submission. App-level provider spend caps and daily allowances are intentionally removed.

## Sources

- Existing event research: [Bolna submission plan](../docs/bolna-buildathon-submission-plan.md).
- [Official event timeline](https://www.bolna.ai/symphony/buildathon) and [submission fields](https://www.bolna.ai/symphony/buildathon/submit), rechecked 31 October 2026. An APK is our chosen reviewer handoff, not a published requirement in that form.
- [Expo APK builds](https://docs.expo.dev/build-reference/apk/): APK configuration and direct installation.
- [Expo SDK 57 splash screen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/): native configuration and release-build preview limitation.
- [Firebase password authentication](https://firebase.google.com/docs/auth/web/password-auth): email/password registration and sign-in.
