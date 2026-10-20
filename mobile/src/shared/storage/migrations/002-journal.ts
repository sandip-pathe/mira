export const journalMigration = {
  version: 2,
  sql: `
    CREATE TABLE journal_sessions (
      id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, initial_prompt TEXT NOT NULL,
      created_at REAL NOT NULL, updated_at REAL NOT NULL,
      saved INTEGER NOT NULL DEFAULT 0 CHECK(saved IN (0,1)),
      revision INTEGER NOT NULL DEFAULT 0, presentation TEXT NOT NULL CHECK(json_valid(presentation))
    );
    CREATE TABLE journal_drafts (
      session_id TEXT PRIMARY KEY REFERENCES journal_sessions(id) ON DELETE CASCADE,
      text TEXT NOT NULL
    );
    CREATE TABLE journal_entries (
      id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES journal_sessions(id) ON DELETE CASCADE,
      text TEXT NOT NULL, input_type TEXT NOT NULL CHECK(input_type IN ('text','voice')), created_at REAL NOT NULL
    );
    CREATE TABLE journal_messages (
      id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES journal_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')), content TEXT NOT NULL,
      entry_id TEXT REFERENCES journal_entries(id) ON DELETE CASCADE,
      created_at REAL NOT NULL, sequence INTEGER NOT NULL, UNIQUE(session_id, sequence)
    );
    CREATE TABLE journal_attachments (
      id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES journal_sessions(id) ON DELETE CASCADE,
      uri TEXT NOT NULL UNIQUE, created_at REAL NOT NULL
    );
    CREATE TABLE memory_items (
      id TEXT PRIMARY KEY NOT NULL, source_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      excerpt TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0 CHECK(approved IN (0,1)),
      revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN (0,1))
    );
    CREATE TABLE journal_deleted_sessions (id TEXT PRIMARY KEY NOT NULL);
    CREATE TABLE journal_file_cleanup (uri TEXT PRIMARY KEY NOT NULL);
    CREATE INDEX journal_entries_session ON journal_entries(session_id, created_at);
    CREATE INDEX journal_messages_session ON journal_messages(session_id, sequence);
    CREATE INDEX journal_attachments_session ON journal_attachments(session_id);
  `,
};
