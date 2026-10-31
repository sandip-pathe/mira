let pending = false;
export function stageCallTalkReturn() { pending = true; }
export function clearCallTalkReturn() { pending = false; }
export function consumeCallTalkReturn() {
  const value = pending; pending = false; return value;
}
