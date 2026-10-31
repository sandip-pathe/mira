const ensureJournalMessagesTable = `
  CREATE TABLE IF NOT EXISTS journal_messages (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES journal_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user','assistant')),
    content TEXT NOT NULL,
    entry_id TEXT REFERENCES journal_entries(id) ON DELETE CASCADE,
    created_at REAL NOT NULL,
    sequence INTEGER NOT NULL,
    UNIQUE(session_id, sequence)
  );
  CREATE INDEX IF NOT EXISTS journal_messages_session ON journal_messages(session_id, sequence);
`;

// Repairs databases that applied the short-lived v12 migration which dropped this table.
export const journalMessagesRecoveryMigration = { version: 13, sql: ensureJournalMessagesTable };
