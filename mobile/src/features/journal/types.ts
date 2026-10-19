export type JournalEntry = {
  id: string;
  text: string;
  input_type: 'text' | 'voice';
  created_at: number;
};
export type JournalMessage = {
  id: string;
  journal_session_id: string;
  role: 'assistant' | 'user';
  content: string;
  entry_id?: string | null;
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
};
export type JournalSession = JournalSessionSummary & { messages: JournalMessage[] };
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
};
