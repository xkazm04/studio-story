export interface Project {
  id: string;
  name: string;
  description?: string;
  type?: string;
  /** Story premise / logline — the core "what if" of the project */
  premise?: string;
  /** Primary genre (e.g. "fantasy", "sci-fi", "romance", "thriller") */
  genre?: string;
  /** World / setting description */
  setting?: string;
  word_count?: number;
  coverImageUrl?: string | null;
  artStyleId?: string | null;
  customArtStylePrompt?: string | null;
  artStyleSource?: string | null;
  extractedStyleImageUrl?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}
