export const activityTakeawaysMigration = {
  version: 4,
  sql: `
    CREATE TABLE activity_takeaways (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)),
      position INTEGER NOT NULL
    );
  `,
};
