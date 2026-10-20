const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

/** Execute the app's actual SQL against temporary SQLite, without an Android runtime. */
exports.createSQLiteHarness = (options = {}) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mira-storage-test-'));
  const handles = new Set();
  return {
    module: {
      async openDatabaseAsync(name, openOptions) {
        assert.equal(name, 'mira-private.db');
        assert.equal(openOptions.useNewConnection, true, 'private DB must bypass the devtools exporter');
        const native = new DatabaseSync(path.join(directory, name));
        handles.add(native);
        return {
          async execAsync(sql) { options.beforeExec?.(sql); native.exec(sql); },
          async runAsync(sql, ...params) {
            options.beforeRun?.(sql, params);
            return native.prepare(sql).run(...params);
          },
          async getFirstAsync(sql, ...params) { return native.prepare(sql).get(...params) ?? null; },
          async getAllAsync(sql, ...params) { return native.prepare(sql).all(...params); },
          async withTransactionAsync(work) {
            native.exec('BEGIN');
            try { await work(); native.exec('COMMIT'); }
            catch (error) { native.exec('ROLLBACK'); throw error; }
          },
          async closeAsync() { native.close(); handles.delete(native); },
        };
      },
    },
    closeConnections() {
      handles.forEach((native) => native.close()); handles.clear();
    },
    close() {
      this.closeConnections();
      for (const filename of ['mira-private.db', 'mira-private.db-wal', 'mira-private.db-shm']) {
        const file = path.join(directory, filename);
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
      fs.rmdirSync(directory);
    },
  };
};
