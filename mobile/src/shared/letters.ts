import { randomUUID } from 'expo-crypto';
import {
  mutateDeviceCollection,
  readDeviceCollection,
  type CollectionSource,
} from './storage/collectionStore';

export type SavedLetter = {
  id: string;
  title: string;
  recipient: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

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

const letterSource: CollectionSource<SavedLetter> = {
  table: 'saved_letters',
  legacyFilename: 'mira.saved-letters.v1.json',
  decode(value) {
    if (!Array.isArray(value) || !value.every(validLetter)) {
      throw new Error(
        'Saved letters could not be imported safely. Your original file is unchanged.',
      );
    }
    return value;
  },
};

export async function loadSavedLetters(): Promise<SavedLetter[]> {
  return (await readDeviceCollection(letterSource)).sort((a, b) => b.updatedAt - a.updatedAt);
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
  return mutateDeviceCollection(letterSource, (letters) => {
    const previous = input.id ? letters.find((letter) => letter.id === input.id) : undefined;
    if (input.id && !previous) throw new Error('This saved letter no longer exists.');
    const now = Date.now();
    const letter: SavedLetter = {
      id: previous?.id ?? randomUUID(),
      title: input.title.trim() || 'Unsent letter',
      recipient: input.recipient.trim(),
      body: input.body,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    return { items: [letter, ...letters.filter((item) => item.id !== letter.id)], result: letter };
  });
}

export function deleteSavedLetter(id: string) {
  return mutateDeviceCollection(letterSource, (letters) => ({
    items: letters.filter((letter) => letter.id !== id),
    result: undefined,
  }));
}

export function clearSavedLetters() {
  return mutateDeviceCollection(letterSource, () => ({ items: [], result: undefined }));
}
