import { File, Paths } from 'expo-file-system';
import { withDeviceTransaction } from '../../../shared/storage/database';

function ownedFile(uri: string) {
  const root = new URL(Paths.document.uri);
  const target = new URL(uri);
  if (
    target.protocol !== 'file:' ||
    target.host !== root.host ||
    !target.pathname.startsWith(root.pathname.endsWith('/') ? root.pathname : root.pathname + '/')
  ) {
    throw new Error('This voice note is outside Mira storage.');
  }
  return new File(uri);
}

/** Only recorded, unreferenced owned paths are eligible; never sweep the documents directory. */
export async function retryJournalFileCleanup(): Promise<boolean> {
  return withDeviceTransaction(async (db) => {
    let complete = true;
    const rows = await db.getAllAsync<{ uri: string }>('SELECT uri FROM journal_file_cleanup');
    for (const { uri } of rows) {
      if (await db.getFirstAsync('SELECT id FROM journal_attachments WHERE uri = ?', uri)) continue;
      try {
        const file = ownedFile(uri);
        if (file.exists) file.delete();
        if (file.exists) throw new Error('File cleanup needs retry.');
        await db.runAsync('DELETE FROM journal_file_cleanup WHERE uri = ?', uri);
      } catch {
        complete = false;
      }
    }
    return complete;
  });
}
