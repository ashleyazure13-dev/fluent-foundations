export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chunks: {
        Row: {
          cefr: string
          created_at: string
          gloss: string
          id: string
          ipa: string | null
          language_code: string
          register: string | null
          tags: string[]
          text: string
        }
        Insert: {
          cefr?: string
          created_at?: string
          gloss: string
          id?: string
          ipa?: string | null
          language_code: string
          register?: string | null
          tags?: string[]
          text: string
        }
        Update: {
          cefr?: string
          created_at?: string
          gloss?: string
          id?: string
          ipa?: string | null
          language_code?: string
          register?: string | null
          tags?: string[]
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunks_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      dialogue_chunks: {
        Row: {
          chunk_id: string
          dialogue_id: string
          position: number
        }
        Insert: {
          chunk_id: string
          dialogue_id: string
          position?: number
        }
        Update: {
          chunk_id?: string
          dialogue_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "dialogue_chunks_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialogue_chunks_dialogue_id_fkey"
            columns: ["dialogue_id"]
            isOneToOne: false
            referencedRelation: "dialogues"
            referencedColumns: ["id"]
          },
        ]
      }
      dialogues: {
        Row: {
          created_at: string
          cultural_note: string | null
          id: string
          scenario: string
          theme_id: string
          title: string
          turns: Json
        }
        Insert: {
          created_at?: string
          cultural_note?: string | null
          id?: string
          scenario: string
          theme_id: string
          title: string
          turns?: Json
        }
        Update: {
          created_at?: string
          cultural_note?: string | null
          id?: string
          scenario?: string
          theme_id?: string
          title?: string
          turns?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dialogues_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_notes: {
        Row: {
          body_md: string
          cefr: string
          created_at: string
          id: string
          language_code: string
          title: string
        }
        Insert: {
          body_md: string
          cefr?: string
          created_at?: string
          id?: string
          language_code: string
          title: string
        }
        Update: {
          body_md?: string
          cefr?: string
          created_at?: string
          id?: string
          language_code?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_notes_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          name: string
          rtl: boolean
          script: string
        }
        Insert: {
          code: string
          created_at?: string
          name: string
          rtl?: boolean
          script?: string
        }
        Update: {
          code?: string
          created_at?: string
          name?: string
          rtl?: boolean
          script?: string
        }
        Relationships: []
      }
      learner_chunks: {
        Row: {
          chunk_id: string
          created_at: string
          difficulty: number
          due_at: string
          lapses: number
          last_grade: number | null
          last_reviewed_at: string | null
          reps: number
          stability: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chunk_id: string
          created_at?: string
          difficulty?: number
          due_at?: string
          lapses?: number
          last_grade?: number | null
          last_reviewed_at?: string | null
          reps?: number
          stability?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chunk_id?: string
          created_at?: string
          difficulty?: number
          due_at?: string
          lapses?: number
          last_grade?: number | null
          last_reviewed_at?: string | null
          reps?: number
          stability?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_chunks_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_languages: {
        Row: {
          cefr_target: string
          language_code: string
          started_at: string
          user_id: string
        }
        Insert: {
          cefr_target?: string
          language_code: string
          started_at?: string
          user_id: string
        }
        Update: {
          cefr_target?: string
          language_code?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_languages_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          lemon_customer_id: string | null
          lemon_subscription_id: string | null
          locale_ui: string
          subscription_ends_at: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          target_language: string
          theme: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          lemon_customer_id?: string | null
          lemon_subscription_id?: string | null
          locale_ui?: string
          subscription_ends_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          target_language?: string
          theme?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          lemon_customer_id?: string | null
          lemon_subscription_id?: string | null
          locale_ui?: string
          subscription_ends_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          target_language?: string
          theme?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_events: {
        Row: {
          chunk_id: string | null
          created_at: string
          grade: number | null
          id: string
          payload: Json
          session_id: string
          step: string
          user_id: string
        }
        Insert: {
          chunk_id?: string | null
          created_at?: string
          grade?: number | null
          id?: string
          payload?: Json
          session_id: string
          step: string
          user_id: string
        }
        Update: {
          chunk_id?: string | null
          created_at?: string
          grade?: number | null
          id?: string
          payload?: Json
          session_id?: string
          step?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_events_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          dialogue_id: string | null
          id: string
          language_code: string
          started_at: string
          summary: Json
          theme_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          dialogue_id?: string | null
          id?: string
          language_code: string
          started_at?: string
          summary?: Json
          theme_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          dialogue_id?: string | null
          id?: string
          language_code?: string
          started_at?: string
          summary?: Json
          theme_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_dialogue_id_fkey"
            columns: ["dialogue_id"]
            isOneToOne: false
            referencedRelation: "dialogues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "sessions_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          cefr: string
          created_at: string
          description: string | null
          id: string
          language_code: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          cefr?: string
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          cefr?: string
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "themes_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "learner" | "admin" | "content_editor"
      subscription_status: "none" | "free_trial" | "active" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["learner", "admin", "content_editor"],
      subscription_status: ["none", "free_trial", "active", "cancelled"],
    },
  },
} as const
