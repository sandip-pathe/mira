# Code quality review and fixes

2026-10-15. Existing app and backend reviewed against the PRD. This pass implements backend correctness fixes used by the app's activity and preference flows.

## Implemented

| Finding | Change | Verification |
|---|---|---|
| Feedback saving committed an action, state update, and preference separately. | `DemoStore.save_completed_feedback` writes the original session run and preference in one SQLite transaction. The original activity timestamp is preserved. | Injected preference-write failure rolls back the run; retry succeeds. |
| A lost save response caused retry to fail; concurrent submissions could duplicate records. | Serialize feedback completion with the store's existing reentrant lock. Retain only the result ID on the session run. Retries read current persisted consent and content. | Repeated and concurrent requests return one preference ID; changed payload conflicts. |
| Retrying after revocation or deletion could undermine a naive retry repair. | A consumed run cannot recreate deleted feedback, restore revoked reuse, or replace the approved text. | Revoke/delete followed by replay returns conflict without restoring data. |
| Reset left earlier session runs available to save afterward. | Reset clears session runs under the same lock used by feedback completion. | Both saved and unsaved pre-reset runs cannot save afterward. |
| An explicit empty review-status allowlist silently allowed demo-approved activities. | Default the allowlist only when it is `None`. | Empty set allows no activities. |
| Selector fallback omitted `intervention`, unlike normal responses. App-level fallback duplicated the same fields. | One shared `listening_decision()` supplies the complete response shape for malformed output, no eligible content, provider unavailability, and failed canonical validation. | Empty catalog and malformed output return the same complete shape; existing selection checks pass. |

## Architecture

```text
Activity screen -> existing feedback API
                         |
                   authorize session
                         |
              serialize completion / reset
                         |
             validate consent + check receipt
                  /                  \
          first submission          retry
                  |                  |
       atomic SQLite write    read current preference
                  |                  |
          session result ID    confirm or conflict
```

The existing catalog/eligibility/decision separation remains useful. The changes reuse SQLite transactions, the existing store lock, request models, and the original activity ID. They add no dependency or table. Receipt IDs remain in the existing expiring session, with no duplicate preference text cached there. Retry guarantees apply to that authorized session; session expiry and server restart still require reconnecting.

## App improvements

- Catalog records now specify presentation pattern, input type, and optional timer. The runner uses those fields and canonical duration rather than activity ID branches. All nine records have matching server contract checks. Deploy the updated backend with this client; missing presentation metadata produces an update-content message.
- Activity lifecycle uses one phase (`loading`, `ready`, `active`, `paused`, `outcome`); timer lifecycle also uses one state. Ready activities no longer pretend to have started or carry fake server IDs. A route identity change remounts the runner to avoid carrying the previous activity's state.
- Preference retry accepts an unsaved result, serializes submissions, and retries an unacknowledged completion using the original session capability. Repeating the same completion is idempotent; changing a final outcome is rejected. Expired or unavailable runs display an unsaved outcome without an endless retry prompt.
- Moving a task preserves duplicate original lines. Missing saved Continue items are reported as failed updates instead of success.
- `useJournalRecording.ts` owns capture, interruption, transcription, and temporary-file cleanup. Overlapping stop requests share one operation. Leaving during preparation cannot start capture afterward. Failed deletion leaves a Discard action available and retries cleanup during this process. This does not guarantee cleanup after process termination or replace device verification.
- Journal deletion has a named operation with failure handling and clears a selected excerpt if its source is deleted. Reset reports partial local failure accurately. Recording and data mutations cannot overlap through ordinary controls.
- Talk and voice callbacks share conversation types. Voice/text proposal parsing and conversation/context rendering each have one implementation. Recognition behavior is preserved pending the confirmation decision.
- Reset or context revocation invalidates pending text replies. A late response cannot restore cleared messages, sources, or offers; carried moment state is cleared on revocation.

## Held decisions

- Actions/Continue navigation, browsing, and retained-content placement still conflict with the PRD. Keep the existing screens and stored data until decided.
- Voice acceptance still uses the existing prefix rules. Choose the confirmation behavior before changing acceptance semantics; ambiguous sentences remain a known issue.
- Clinical content, public use, authentication, and deployment remain separately scoped decisions.

Device verification is pending for the changed Journal controller: record/stop, navigate away during preparation/capture, background/foreground, transcription retry/discard, and Talk voice after leaving Journal. Record Android version on the OnePlus. Mocked checks establish controller behavior only.

## Review coverage and checks

Primary code and architecture review plus an independent in-host backend review. Existing server contract checks and targeted regressions use temporary databases and mocked provider responses. No live provider calls or device walkthrough were performed.

Verification: 27 server contract tests pass, including catalog presentation, idempotent completion, concurrent submissions, and injected transaction failure. The focused Journal lifecycle checks pass with native modules mocked. TypeScript passes. The first backend attempt used default Python and failed to import FastAPI; running through the existing server virtual environment resolved that environment issue.

Autoplan intake produced `code_quality_plan.md`, a source restore point, and CEO methodology material. The full sequential CEO/design/DX/engineering pipeline and final approval gate were not completed; these fixes must not be represented as a completed autoplan run. Git metadata is absent, so branch history and diff-based review are unavailable. No outside Claude review was completed.

Durable project detail: use `server/.venv/Scripts/python.exe` for backend checks; the default Python lacks FastAPI.
