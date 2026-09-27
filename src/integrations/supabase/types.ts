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
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          reason: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          reason?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          reason?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          target_id: string
          target_type: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          text?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          caption: string
          created_at: string
          hashtags: string[]
          id: string
          media_type: string | null
          media_url: string | null
          shares_count: number
          space_slug: string | null
        }
        Insert: {
          author_id: string
          caption?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          media_type?: string | null
          media_url?: string | null
          shares_count?: number
          space_slug?: string | null
        }
        Update: {
          author_id?: string
          caption?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          media_type?: string | null
          media_url?: string | null
          shares_count?: number
          space_slug?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string
          banner: string | null
          bio: string
          birth_date: string | null
          business_profile: Json | null
          created_at: string
          email: string
          full_name: string
          gender: string | null
          id: string
          is_business: boolean
          is_deactivated: boolean
          is_verified: boolean
          phone: string | null
          pie_id: string
          privacy_settings: Json
          role: Database["public"]["Enums"]["app_role"]
          username: string
        }
        Insert: {
          avatar?: string
          banner?: string | null
          bio?: string
          birth_date?: string | null
          business_profile?: Json | null
          created_at?: string
          email?: string
          full_name?: string
          gender?: string | null
          id: string
          is_business?: boolean
          is_deactivated?: boolean
          is_verified?: boolean
          phone?: string | null
          pie_id: string
          privacy_settings?: Json
          role?: Database["public"]["Enums"]["app_role"]
          username: string
        }
        Update: {
          avatar?: string
          banner?: string | null
          bio?: string
          birth_date?: string | null
          business_profile?: Json | null
          created_at?: string
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_business?: boolean
          is_deactivated?: boolean
          is_verified?: boolean
          phone?: string | null
          pie_id?: string
          privacy_settings?: Json
          role?: Database["public"]["Enums"]["app_role"]
          username?: string
        }
        Relationships: []
      }
      pyes: {
        Row: {
          author_id: string
          caption: string
          created_at: string
          hashtags: string[]
          id: string
          moderation_status: string
          music_author: string | null
          music_title: string | null
          poster_url: string
          shares_count: number
          sound_id: string | null
          space_slug: string | null
          title: string | null
          video_url: string
          views_count: number
          visibility: string
        }
        Insert: {
          author_id: string
          caption?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          moderation_status?: string
          music_author?: string | null
          music_title?: string | null
          poster_url?: string
          shares_count?: number
          sound_id?: string | null
          space_slug?: string | null
          title?: string | null
          video_url: string
          views_count?: number
          visibility?: string
        }
        Update: {
          author_id?: string
          caption?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          moderation_status?: string
          music_author?: string | null
          music_title?: string | null
          poster_url?: string
          shares_count?: number
          sound_id?: string | null
          space_slug?: string | null
          title?: string | null
          video_url?: string
          views_count?: number
          visibility?: string
        }
        Relationships: []
      }
      saves: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      sounds: {
        Row: {
          artist: string
          audio_url: string
          author_id: string | null
          category: string
          cover_url: string
          created_at: string
          duration: string
          id: string
          plays_count: number
          tags: string[]
          title: string
          usage_count: number
        }
        Insert: {
          artist?: string
          audio_url: string
          author_id?: string | null
          category?: string
          cover_url?: string
          created_at?: string
          duration?: string
          id?: string
          plays_count?: number
          tags?: string[]
          title: string
          usage_count?: number
        }
        Update: {
          artist?: string
          audio_url?: string
          author_id?: string | null
          category?: string
          cover_url?: string
          created_at?: string
          duration?: string
          id?: string
          plays_count?: number
          tags?: string[]
          title?: string
          usage_count?: number
        }
        Relationships: []
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
      wallets: {
        Row: {
          gold_coins: number
          last_daily_claim_at: string | null
          signup_bonus_granted: boolean
          silver_coins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          gold_coins?: number
          last_daily_claim_at?: string | null
          signup_bonus_granted?: boolean
          silver_coins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          gold_coins?: number
          last_daily_claim_at?: string | null
          signup_bonus_granted?: boolean
          silver_coins?: number
          updated_at?: string
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
      app_role: "user" | "creator" | "admin" | "business"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["user", "creator", "admin", "business"],
    },
  },
} as const
