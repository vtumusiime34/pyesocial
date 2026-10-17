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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      account_appeals: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          status: string
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          message: string
          status?: string
          user_id?: string | null
          username?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          status?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          advertiser_id: string
          advertiser_name: string
          budget_coins: number
          call_to_action: string
          category: string
          clicks: number
          created_at: string
          description: string
          destination_url: string
          end_date: string
          id: string
          impressions: number
          media_type: string
          media_url: string
          start_date: string
          status: string
          target_audience: string
          title: string
        }
        Insert: {
          advertiser_id: string
          advertiser_name?: string
          budget_coins?: number
          call_to_action?: string
          category?: string
          clicks?: number
          created_at?: string
          description?: string
          destination_url?: string
          end_date?: string
          id?: string
          impressions?: number
          media_type?: string
          media_url?: string
          start_date?: string
          status?: string
          target_audience?: string
          title: string
        }
        Update: {
          advertiser_id?: string
          advertiser_name?: string
          budget_coins?: number
          call_to_action?: string
          category?: string
          clicks?: number
          created_at?: string
          description?: string
          destination_url?: string
          end_date?: string
          id?: string
          impressions?: number
          media_type?: string
          media_url?: string
          start_date?: string
          status?: string
          target_audience?: string
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: string
          id: string
          target: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: string
          id?: string
          target?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: string
          id?: string
          target?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
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
      conference_participants: {
        Row: {
          conference_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conference_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conference_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_participants_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      conferences: {
        Row: {
          category: string
          cover_image: string
          created_at: string
          description: string
          host_id: string
          id: string
          max_participants: number
          privacy: string
          scheduled_date: string
          scheduled_time: string
          speakers: string[]
          sponsored_by: string | null
          title: string
        }
        Insert: {
          category?: string
          cover_image?: string
          created_at?: string
          description?: string
          host_id: string
          id?: string
          max_participants?: number
          privacy?: string
          scheduled_date?: string
          scheduled_time?: string
          speakers?: string[]
          sponsored_by?: string | null
          title: string
        }
        Update: {
          category?: string
          cover_image?: string
          created_at?: string
          description?: string
          host_id?: string
          id?: string
          max_participants?: number
          privacy?: string
          scheduled_date?: string
          scheduled_time?: string
          speakers?: string[]
          sponsored_by?: string | null
          title?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string
          last_message_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string
          last_message_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string
          last_message_at?: string
          user_a?: string
          user_b?: string
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
      game_records: {
        Row: {
          coins_earned: number
          game_id: string
          id: string
          opponent_name: string
          played_at: string
          result: string
          score: number
          user_id: string
        }
        Insert: {
          coins_earned?: number
          game_id: string
          id?: string
          opponent_name?: string
          played_at?: string
          result: string
          score?: number
          user_id: string
        }
        Update: {
          coins_earned?: number
          game_id?: string
          id?: string
          opponent_name?: string
          played_at?: string
          result?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      game_rooms: {
        Row: {
          created_at: string
          game_id: string
          guest_id: string | null
          host_id: string
          id: string
          state: Json
          status: string
          turn_user_id: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          game_id: string
          guest_id?: string | null
          host_id: string
          id?: string
          state?: Json
          status?: string
          turn_user_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string
          guest_id?: string | null
          host_id?: string
          id?: string
          state?: Json
          status?: string
          turn_user_id?: string | null
          updated_at?: string
          winner_id?: string | null
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
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_claims: {
        Row: {
          claim_date: string
          created_at: string
          id: string
          mission_id: string
          user_id: string
        }
        Insert: {
          claim_date?: string
          created_at?: string
          id?: string
          mission_id: string
          user_id: string
        }
        Update: {
          claim_date?: string
          created_at?: string
          id?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          target_id: string | null
          target_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          target_id?: string | null
          target_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          target_id?: string | null
          target_type?: string | null
          type?: string
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
      promoted_content: {
        Row: {
          audience: string
          author_id: string
          budget_coins: number
          content_id: string
          content_title: string
          content_type: string
          created_at: string
          duration_days: number
          goal: string
          id: string
          status: string
        }
        Insert: {
          audience?: string
          author_id: string
          budget_coins?: number
          content_id: string
          content_title?: string
          content_type: string
          created_at?: string
          duration_days?: number
          goal?: string
          id?: string
          status?: string
        }
        Update: {
          audience?: string
          author_id?: string
          budget_coins?: number
          content_id?: string
          content_title?: string
          content_type?: string
          created_at?: string
          duration_days?: number
          goal?: string
          id?: string
          status?: string
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
      safety_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          reason: string
          reported_item_id: string
          reported_item_type: string
          reported_title: string | null
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          reason: string
          reported_item_id: string
          reported_item_type: string
          reported_title?: string | null
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          reason?: string
          reported_item_id?: string
          reported_item_type?: string
          reported_title?: string | null
          reporter_id?: string
          status?: string
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
      admin_set_deactivated: {
        Args: { _deactivated: boolean; _user_id: string }
        Returns: Json
      }
      admin_set_verified: {
        Args: { _user_id: string; _verified: boolean }
        Returns: Json
      }
      claim_mission_reward: { Args: { _mission_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_post_shares: { Args: { _post_id: string }; Returns: undefined }
      increment_pyes_shares: { Args: { _pyes_id: string }; Returns: undefined }
      increment_pyes_views: { Args: { _pyes_id: string }; Returns: undefined }
      increment_sound_plays: { Args: { _sound_id: string }; Returns: undefined }
      increment_sound_usage: { Args: { _sound_id: string }; Returns: undefined }
      log_admin_action: {
        Args: { _action: string; _details: string; _target: string }
        Returns: undefined
      }
      mission_reward: {
        Args: { _mission_id: string }
        Returns: Record<string, unknown>
      }
      record_game_outcome: {
        Args: {
          _game_id: string
          _opponent_name: string
          _result: string
          _score: number
        }
        Returns: Json
      }
      send_coins: {
        Args: {
          _amount: number
          _currency: string
          _reason?: string
          _recipient: string
        }
        Returns: Json
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
