import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';

export type SavedLetter = {
  id: string;
  title: string;
  recipient: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

const archiveFile = new File(Paths.document, 'mira.saved-letters.v1.json');

function validLetter(value: unknown): value is SavedLetter {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedLetter>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.recipient === 'string' &&
    typeof item.body === 'string' &&
    typeof item.createdAt === 'number' &&
    typeof item.updatedAt === 'number'
  );
}

export async function loadSavedLetters(): Promise<SavedLetter[]> {
  if (!archiveFile.exists) return [];
  try {
    const value: unknown = JSON.parse(await archiveFile.text());
    return Array.isArray(value)
      ? value.filter(validLetter).sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  } catch {
    throw new Error('Saved letters could not be opened.');
  }
}

async function writeSavedLetters(letters: SavedLetter[]) {
  const stagedFile = new File(Paths.document, 'mira.saved-letters.v1.next');
  stagedFile.create({ overwrite: true });
  stagedFile.write(JSON.stringify(letters));
  await stagedFile.move(archiveFile, { overwrite: true });
}

export async function saveLetter(input: {
  id?: string;
  title: string;
  recipient: string;
  body: string;
}): Promise<SavedLetter> {
  if (input.body.length > 12000 || input.title.length > 100 || input.recipient.length > 100) {
    throw new Error('Letter is too long to save.');
  }
  const letters = await loadSavedLetters();
  const previous = input.id ? letters.find((letter) => letter.id === input.id) : undefined;
  const now = Date.now();
  const letter: SavedLetter = {
    id: previous?.id ?? randomUUID(),
    title: input.title.trim() || 'Unsent letter',
    recipient: input.recipient.trim(),
    body: input.body,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  await writeSavedLetters([letter, ...letters.filter((item) => item.id !== letter.id)]);
  return letter;
}

export async function deleteSavedLetter(id: string) {
  await writeSavedLetters((await loadSavedLetters()).filter((letter) => letter.id !== id));
}

export async function clearSavedLetters() {
  await writeSavedLetters([]);
}
