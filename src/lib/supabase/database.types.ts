/**
 * Supabase Database Types
 * Generated types for database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string | null
          email: string | null
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id?: string | null
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string | null
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      acts: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      scenes: {
        Row: {
          id: string
          project_id: string
          act_id: string
          name: string
          description: string | null
          order: number
          script: string | null
          location: string | null
          image_url: string | null
          image_prompt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          act_id: string
          name: string
          description?: string | null
          order?: number
          script?: string | null
          location?: string | null
          image_url?: string | null
          image_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          act_id?: string
          name?: string
          description?: string | null
          order?: number
          script?: string | null
          location?: string | null
          image_url?: string | null
          image_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      factions: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          color: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          color?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          color?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          project_id: string
          faction_id: string | null
          name: string
          type: string | null
          voice: string | null
          avatar_url: string | null
          transparent_avatar_url: string | null
          body_url: string | null
          transparent_body_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          faction_id?: string | null
          name: string
          type?: string | null
          voice?: string | null
          avatar_url?: string | null
          transparent_avatar_url?: string | null
          body_url?: string | null
          transparent_body_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          faction_id?: string | null
          name?: string
          type?: string | null
          voice?: string | null
          avatar_url?: string | null
          transparent_avatar_url?: string | null
          body_url?: string | null
          transparent_body_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      traits: {
        Row: {
          id: string
          character_id: string
          type: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          character_id: string
          type: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          type?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      character_relationships: {
        Row: {
          id: string
          character_a_id: string
          character_b_id: string
          act_id: string | null
          relationship_type: string | null
          description: string
          event_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          character_a_id: string
          character_b_id: string
          act_id?: string | null
          relationship_type?: string | null
          description: string
          event_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          character_a_id?: string
          character_b_id?: string
          act_id?: string | null
          relationship_type?: string | null
          description?: string
          event_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      faction_relationships: {
        Row: {
          id: string
          faction_a_id: string
          faction_b_id: string
          relationship_type: string | null
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          faction_a_id: string
          faction_b_id: string
          relationship_type?: string | null
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          faction_a_id?: string
          faction_b_id?: string
          relationship_type?: string | null
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      beats: {
        Row: {
          id: string
          project_id: string | null
          act_id: string | null
          name: string
          type: string
          description: string | null
          order: number
          paragraph_id: string | null
          paragraph_title: string | null
          completed: boolean
          default_flag: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          act_id?: string | null
          name: string
          type: string
          description?: string | null
          order?: number
          paragraph_id?: string | null
          paragraph_title?: string | null
          completed?: boolean
          default_flag?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          act_id?: string | null
          name?: string
          type?: string
          description?: string | null
          order?: number
          paragraph_id?: string | null
          paragraph_title?: string | null
          completed?: boolean
          default_flag?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      char_appearance: {
        Row: {
          character_id: string
          gender: string | null
          age: string | null
          skin_color: string | null
          body_type: string | null
          height: string | null
          face_shape: string | null
          eye_color: string | null
          hair_color: string | null
          hair_style: string | null
          facial_hair: string | null
          face_features: string | null
          clothing_style: string | null
          clothing_color: string | null
          clothing_accessories: string | null
          custom_features: string | null
          prompt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          character_id: string
          gender?: string | null
          age?: string | null
          skin_color?: string | null
          body_type?: string | null
          height?: string | null
          face_shape?: string | null
          eye_color?: string | null
          hair_color?: string | null
          hair_style?: string | null
          facial_hair?: string | null
          face_features?: string | null
          clothing_style?: string | null
          clothing_color?: string | null
          clothing_accessories?: string | null
          custom_features?: string | null
          prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          gender?: string | null
          age?: string | null
          skin_color?: string | null
          body_type?: string | null
          height?: string | null
          face_shape?: string | null
          eye_color?: string | null
          hair_color?: string | null
          hair_style?: string | null
          facial_hair?: string | null
          face_features?: string | null
          clothing_style?: string | null
          clothing_color?: string | null
          clothing_accessories?: string | null
          custom_features?: string | null
          prompt?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}


