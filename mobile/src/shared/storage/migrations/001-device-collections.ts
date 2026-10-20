// Only explicitly saved collections belong here. Journal schemas arrive with OF-04.
export const deviceCollectionsMigration = {
  version: 1,
  sql: `
    CREATE TABLE storage_migrations (
      name TEXT PRIMARY KEY NOT NULL,
      source_count INTEGER NOT NULL,
      completed_at INTEGER NOT NULL
    );
    CREATE TABLE continue_items (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL CHECK (json_valid(payload)),
      position INTEGER NOT NULL
    );
    CREATE TABLE saved_letters (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL CHECK (json_valid(payload)),
      position INTEGER NOT NULL
    );
    CREATE TABLE activity_preferences (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL CHECK (json_valid(payload)),
      position INTEGER NOT NULL
    );
  `,
};
