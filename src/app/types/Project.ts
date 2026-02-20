export interface Project {
  id: string;
  name: string;
  description?: string;
  type?: string;
  word_count?: number;
  coverImageUrl?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}
