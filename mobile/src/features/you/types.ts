export type JournalEntry = {
  id: string;
  text: string;
  input_type: 'text' | 'voice';
  created_at: number;
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
};
