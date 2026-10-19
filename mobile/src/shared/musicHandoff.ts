let quietTalkReturnPending = false;

/** Keep Talk quiet for the next in-process return from an external music app. */
export function stageQuietTalkReturn() {
  quietTalkReturnPending = true;
}

export function consumeQuietTalkReturn() {
  const pending = quietTalkReturnPending;
  quietTalkReturnPending = false;
  return pending;
}
