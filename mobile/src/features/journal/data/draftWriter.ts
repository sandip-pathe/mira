import type { JournalDraftSnapshot } from '../types';

/** Own captured drafts by session ID so navigation cannot redirect a delayed write. */
export class JournalDraftWriter {
  private pending = new Map<string, JournalDraftSnapshot>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private write: (snapshot: JournalDraftSnapshot) => Promise<unknown>,
    private failed: (snapshot: JournalDraftSnapshot, error: unknown) => void = () => {},
  ) {}

  setFailureHandler(handler: (snapshot: JournalDraftSnapshot, error: unknown) => void) {
    this.failed = handler;
  }

  queue(snapshot: JournalDraftSnapshot, delay = 350) {
    this.forget(snapshot.id);
    this.pending.set(snapshot.id, snapshot);
    this.timers.set(
      snapshot.id,
      setTimeout(() => {
        void this.flush(snapshot.id);
      }, delay),
    );
  }

  snapshots() {
    return [...this.pending.values()];
  }

  forget(id: string) {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.pending.delete(id);
  }

  async flush(id: string): Promise<boolean> {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    const snapshot = this.pending.get(id);
    if (!snapshot) return true;
    try {
      await this.write(snapshot);
      if (this.pending.get(id) === snapshot) this.pending.delete(id);
      return true;
    } catch (error) {
      if (this.pending.get(id) === snapshot) this.failed(snapshot, error);
      return false;
    }
  }

  async flushAll() {
    return Promise.all(this.snapshots().map((snapshot) => this.flush(snapshot.id)));
  }
}
