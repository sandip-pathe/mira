export const savedWordingsMigration = {
  version: 7,
  sql: `
    CREATE TABLE saved_wordings (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)),
      position INTEGER NOT NULL
    );
  `,
};
