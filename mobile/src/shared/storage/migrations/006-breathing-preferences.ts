export const breathingPreferencesMigration = {
  version: 6,
  sql: `
    CREATE TABLE breathing_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      default_rhythm TEXT NOT NULL DEFAULT 'equal' CHECK (default_rhythm IN ('equal', 'longer_exhale', 'double_inhale', 'own_pace')),
      touch_cue INTEGER NOT NULL DEFAULT 0 CHECK (touch_cue IN (0, 1)),
      audio_cue INTEGER NOT NULL DEFAULT 0 CHECK (audio_cue IN (0, 1)),
      updated_at INTEGER NOT NULL DEFAULT 0
    );
    INSERT INTO breathing_preferences (id) VALUES (1);
  `,
};
