const resetListeners = new Set<() => void>();
const contextRevokedListeners = new Set<() => void>();
const urgentHelpListeners = new Set<() => void>();

export function onDemoReset(listener: () => void) {
  resetListeners.add(listener);
  return () => resetListeners.delete(listener);
}

export function emitDemoReset() {
  resetListeners.forEach((listener) => listener());
}

export function onContextRevoked(listener: () => void) {
  contextRevokedListeners.add(listener);
  return () => contextRevokedListeners.delete(listener);
}

export function emitContextRevoked() {
  contextRevokedListeners.forEach((listener) => listener());
}

export function onUrgentHelp(listener: () => void) {
  urgentHelpListeners.add(listener);
  return () => urgentHelpListeners.delete(listener);
}

export function emitUrgentHelp() {
  urgentHelpListeners.forEach((listener) => listener());
}
