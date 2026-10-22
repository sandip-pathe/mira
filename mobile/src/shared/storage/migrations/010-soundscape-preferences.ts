export const soundscapePreferencesMigration = {
  version: 10,
  sql: `
    CREATE TABLE soundscape_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      preferred_scene TEXT CHECK (preferred_scene IN ('rain', 'canopy', 'shore')),
      updated_at INTEGER NOT NULL DEFAULT 0
    );
    INSERT INTO soundscape_preferences (id) VALUES (1);
  `,
};
