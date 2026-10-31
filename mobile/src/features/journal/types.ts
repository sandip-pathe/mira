export type JournalEntry = {
  id: string;
  text: string;
  input_type: 'text' | 'voice';
  created_at: number;
};
export type JournalSessionSummary = {
  id: string;
  title: string;
  initial_prompt: string;
  created_at: number;
  updated_at: number;
  saved: boolean;
  preview?: string | null;
  entry_count: number;
  attachment_count?: number;
};
export type JournalVoiceNote = { id: string; uri: string; created_at: number };
export type JournalPresentation = { palette: { light: string; dark: string }; fontSize: number };
export type JournalDraftSnapshot = {
  id: string;
  prompt: string;
  text: string;
  revision: number;
  presentation: JournalPresentation;
};
export type LocalJournalSession = JournalSessionSummary & {
  entries: JournalEntry[];
  voice_notes: JournalVoiceNote[];
  draft: string;
  revision: number;
  presentation: JournalPresentation;
};
export type MemoryItem = {
  id: string;
  source_entry_id: string;
  excerpt: string;
  approved: number;
  revoked: number;
};
export type FeedbackItem = {
  id: string;
  action_id: string;
  rating: string;
  reuse_context: number;
  helpful_lesson?: string | null;
  storage?: 'device';
};
