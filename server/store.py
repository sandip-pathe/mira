"""Small SQLite store for the single synthetic demo user."""
import os
import re
import sqlite3
import threading
import time
from uuid import uuid4


class DemoStore:
    def __init__(self, path: str | None = None):
        path = path or os.getenv('MIRA_DB_PATH') or os.path.join(os.path.dirname(__file__), 'mira.db')
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA foreign_keys = ON')
        self.lock = threading.RLock()
        self.db.executescript('''
          CREATE TABLE IF NOT EXISTS journal_entries (
            id TEXT PRIMARY KEY, text TEXT NOT NULL, input_type TEXT NOT NULL, created_at REAL NOT NULL
          );
          CREATE TABLE IF NOT EXISTS memory_items (
            id TEXT PRIMARY KEY, source_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
            excerpt TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0, revoked INTEGER NOT NULL DEFAULT 0,
            created_at REAL NOT NULL
          );
          CREATE TABLE IF NOT EXISTS action_runs (
            id TEXT PRIMARY KEY, action_id TEXT NOT NULL, state TEXT NOT NULL, created_at REAL NOT NULL
          );
          CREATE TABLE IF NOT EXISTS feedback (
            id TEXT PRIMARY KEY, action_run_id TEXT NOT NULL UNIQUE REFERENCES action_runs(id) ON DELETE CASCADE,
            rating TEXT NOT NULL, reuse_context INTEGER NOT NULL DEFAULT 0, created_at REAL NOT NULL,
            helpful_lesson TEXT
          );
        ''')
        columns = {row['name'] for row in self.db.execute('PRAGMA table_info(feedback)')}
        if 'helpful_lesson' not in columns:
            self.db.execute('ALTER TABLE feedback ADD COLUMN helpful_lesson TEXT')
        self.db.commit()

    def _rows(self, sql, args=()):
        with self.lock:
            return [dict(row) for row in self.db.execute(sql, args).fetchall()]

    def _one(self, sql, args=()):
        rows = self._rows(sql, args)
        return rows[0] if rows else None

    def _write(self, sql, args=()):
        with self.lock:
            cur = self.db.execute(sql, args)
            self.db.commit()
            return cur

    def entries(self):
        return self._rows('SELECT * FROM journal_entries ORDER BY created_at DESC')

    def entry(self, entry_id):
        return self._one('SELECT * FROM journal_entries WHERE id=?', (entry_id,))

    def save_entry(self, text, input_type):
        item = {'id': str(uuid4()), 'text': text, 'input_type': input_type, 'created_at': time.time()}
        self._write('INSERT INTO journal_entries VALUES (:id,:text,:input_type,:created_at)', item)
        return item

    def delete_entry(self, entry_id):
        return self._write('DELETE FROM journal_entries WHERE id=?', (entry_id,)).rowcount > 0

    def memories(self):
        return self._rows('''SELECT m.*, j.created_at AS source_created_at FROM memory_items m
          JOIN journal_entries j ON j.id=m.source_entry_id ORDER BY m.created_at DESC''')

    def create_memory(self, source_id, excerpt):
        item = {'id': str(uuid4()), 'source_entry_id': source_id, 'excerpt': excerpt,
                'approved': 0, 'revoked': 0, 'created_at': time.time()}
        self._write('INSERT INTO memory_items VALUES (:id,:source_entry_id,:excerpt,:approved,:revoked,:created_at)', item)
        return item

    def memory(self, memory_id):
        return self._one('SELECT * FROM memory_items WHERE id=?', (memory_id,))

    def set_memory(self, memory_id, approved, revoked=0):
        cur = self._write('UPDATE memory_items SET approved=?, revoked=? WHERE id=?', (approved, revoked, memory_id))
        return cur.rowcount > 0

    def delete_memory(self, memory_id):
        return self._write('DELETE FROM memory_items WHERE id=?', (memory_id,)).rowcount > 0

    def retrieve(self, query):
        words = {w.lower() for w in re.findall(r"[a-z0-9']+", query) if len(w) > 2}
        if not words:
            return []
        candidates = []
        query_date = None
        current_day = time.strftime('%Y-%m-%d', time.localtime())
        yesterday_day = time.strftime('%Y-%m-%d', time.localtime(time.time() - 86400))
        if 'yesterday' in words:
            query_date = yesterday_day
        elif 'today' in words:
            query_date = current_day

        for row in self._rows('''SELECT m.id,m.source_entry_id,m.excerpt,m.created_at,j.created_at AS entry_created_at
          FROM memory_items m JOIN journal_entries j ON j.id=m.source_entry_id
          WHERE m.approved=1 AND m.revoked=0'''):
            text = row['excerpt']
            score = sum(1 for word in words if re.search(r'\b' + re.escape(word) + r'\b', text, re.I))
            entry_day = time.strftime('%Y-%m-%d', time.localtime(row['entry_created_at']))
            if query_date and entry_day == query_date:
                score += 3
            if score:
                candidates.append((score, row['created_at'], {'id': row['id'], 'source_type': 'journal',
                    'source_id': row['source_entry_id'], 'excerpt': text, 'created_at': row['entry_created_at']}))

        action_terms = {'action', 'actions', 'doing', 'trying', 'activity', 'activities', 'task', 'reset', 'pause', 'started', 'stopped', 'completed'}
        action_related = bool(words & action_terms) or query_date is not None
        if action_related:
            for row in self._rows('''SELECT a.id,a.action_id,a.state,a.created_at FROM action_runs a
              JOIN feedback f ON f.action_run_id=a.id WHERE f.reuse_context=1 ORDER BY a.created_at DESC'''):
                title = row['action_id'].replace('_60s', '').replace('_', ' ')
                title = title[:1].upper() + title[1:]
                state = 'in progress' if row['state'] == 'started' else row['state']
                description = f"Action activity: {title}, {state}."
                run_day = time.strftime('%Y-%m-%d', time.localtime(row['created_at']))
                score = sum(1 for word in words if re.search(r'\b' + re.escape(word) + r'\b', description, re.I))
                if query_date and run_day == query_date:
                    score += 3
                if row['state'] == 'started' and (words & {'doing', 'trying', 'activity', 'activities', 'task', 'action', 'actions'}):
                    score += 3
                if score:
                    candidates.append((score, row['created_at'], {'id': row['id'], 'source_type': 'action',
                        'source_id': row['id'], 'excerpt': description, 'created_at': row['created_at']}))
        for row in self._rows('''SELECT f.id,f.action_run_id,f.rating,f.helpful_lesson,a.action_id FROM feedback f
          JOIN action_runs a ON a.id=f.action_run_id WHERE f.reuse_context=1'''):
            text = row['helpful_lesson'] or f"Feedback about {row['action_id'].replace('_', ' ')}: {row['rating'].replace('_', ' ')}"
            score = sum(1 for word in words if re.search(r'\b' + re.escape(word) + r'\b', text, re.I))
            if score:
                candidates.append((score, 0, {'id': row['id'], 'source_type': 'feedback',
                    'source_id': row['action_run_id'], 'excerpt': text}))
        candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
        return [item[2] for item in candidates[:1]]

    def start_action(self, action_id):
        item = {'id': str(uuid4()), 'action_id': action_id, 'state': 'started', 'created_at': time.time()}
        self._write('INSERT INTO action_runs VALUES (:id,:action_id,:state,:created_at)', item)
        return item

    def action_run(self, run_id):
        return self._one('SELECT * FROM action_runs WHERE id=?', (run_id,))

    def set_action_state(self, run_id, state):
        cur = self._write('UPDATE action_runs SET state=? WHERE id=?', (state, run_id))
        return cur.rowcount > 0

    def save_feedback(self, run_id, rating, reuse_context, helpful_lesson=None):
        with self.lock:
            existing = self._one('SELECT id FROM feedback WHERE action_run_id=?', (run_id,))
            if existing:
                self._write('UPDATE feedback SET rating=?,reuse_context=?,helpful_lesson=? WHERE id=?',
                    (rating, int(reuse_context), helpful_lesson, existing['id']))
                return self._one('SELECT * FROM feedback WHERE id=?', (existing['id'],))
            item = {'id': str(uuid4()), 'action_run_id': run_id, 'rating': rating,
                    'reuse_context': int(reuse_context), 'created_at': time.time(), 'helpful_lesson': helpful_lesson}
            self._write('INSERT INTO feedback (id,action_run_id,rating,reuse_context,created_at,helpful_lesson) VALUES (:id,:action_run_id,:rating,:reuse_context,:created_at,:helpful_lesson)', item)
            return item

    def feedback(self):
        return self._rows('''SELECT f.*, a.action_id FROM feedback f JOIN action_runs a ON a.id=f.action_run_id
          ORDER BY f.created_at DESC''')

    def save_completed_feedback(self, run, rating, helpful_lesson):
        """Persist the consented run and preference in one transaction."""
        item = {'id': str(uuid4()), 'action_run_id': run['id'], 'rating': rating,
                'reuse_context': 1, 'created_at': time.time(), 'helpful_lesson': helpful_lesson}
        with self.lock, self.db:
            self.db.execute('''INSERT INTO action_runs (id,action_id,state,created_at)
              VALUES (:id,:action_id,:state,:created_at)''', run)
            self.db.execute('''INSERT INTO feedback
              (id,action_run_id,rating,reuse_context,created_at,helpful_lesson)
              VALUES (:id,:action_run_id,:rating,:reuse_context,:created_at,:helpful_lesson)''', item)
        return item

    def feedback_context(self, feedback_id):
        return self._one('''SELECT f.*, a.action_id FROM feedback f JOIN action_runs a ON a.id=f.action_run_id
          WHERE f.id=? AND f.reuse_context=1''', (feedback_id,))

    def update_feedback_reuse(self, feedback_id, reuse_context):
        cur = self._write('UPDATE feedback SET reuse_context=? WHERE id=?', (int(reuse_context), feedback_id))
        return cur.rowcount > 0

    def delete_feedback(self, feedback_id):
        cur = self._write('DELETE FROM action_runs WHERE id=(SELECT action_run_id FROM feedback WHERE id=?)', (feedback_id,))
        return cur.rowcount > 0

    def reset(self):
        with self.lock:
            self.db.executescript('DELETE FROM feedback; DELETE FROM action_runs; DELETE FROM memory_items; DELETE FROM journal_entries;')
            self.db.commit()
