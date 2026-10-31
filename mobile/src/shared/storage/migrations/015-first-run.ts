export const firstRunMigration = {
  version: 15,
  sql: "ALTER TABLE app_preferences ADD COLUMN welcome_completed INTEGER NOT NULL DEFAULT 0 CHECK (welcome_completed IN (0, 1));",
};
