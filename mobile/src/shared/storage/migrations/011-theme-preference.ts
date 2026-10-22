export const themePreferenceMigration = {
  version: 11,
  sql: `
    CREATE TABLE app_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme_id TEXT NOT NULL DEFAULT 'warm-light'
        CHECK (theme_id IN ('warm-light', 'forest-dark', 'blackout'))
    );
    INSERT INTO app_preferences (id) VALUES (1);
  `,
};
