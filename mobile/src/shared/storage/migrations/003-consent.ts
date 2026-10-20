export const consentMigration = {
  version: 3,
  sql: `
    CREATE TABLE consent_state (
      id INTEGER PRIMARY KEY CHECK(id = 1), revision INTEGER NOT NULL DEFAULT 0
    );
    INSERT INTO consent_state (id, revision) VALUES (1, 0);
  `,
};
