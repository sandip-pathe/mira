export const moveScenePreferencesMigration = {
  version: 9,
  sql: `
    CREATE TABLE move_scene_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      preferred_choice TEXT CHECK (preferred_choice IN ('walk', 'move_here', 'change_spot', 'custom', 'stay')),
      remember_choice INTEGER NOT NULL DEFAULT 0 CHECK (remember_choice IN (0, 1)),
      show_elapsed INTEGER NOT NULL DEFAULT 0 CHECK (show_elapsed IN (0, 1)),
      audio_cue INTEGER NOT NULL DEFAULT 0 CHECK (audio_cue IN (0, 1)),
      updated_at INTEGER NOT NULL DEFAULT 0
    );
    INSERT INTO move_scene_preferences (id) VALUES (1);
  `,
};
