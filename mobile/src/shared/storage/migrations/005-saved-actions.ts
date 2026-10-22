export const savedActionsMigration = {
  version: 5,
  sql: `
    CREATE TABLE saved_actions (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)),
      position INTEGER NOT NULL
    );
  `,
};
