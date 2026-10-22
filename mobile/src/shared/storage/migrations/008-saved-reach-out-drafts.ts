export const savedReachOutDraftsMigration = {
  version: 8,
  sql: `
    CREATE TABLE saved_reach_out_drafts (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)),
      position INTEGER NOT NULL
    );
  `,
};
