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
      achievements_catalog: {
        Row: {
          category: string
          desc_ar: string
          desc_en: string
          id: string
          name_ar: string
          name_en: string
          rarity: string
          sort_order: number
          soul_reward: number
          target: number
          title_reward: string | null
          xp_reward: number
        }
        Insert: {
          category: string
          desc_ar?: string
          desc_en?: string
          id: string
          name_ar: string
          name_en: string
          rarity?: string
          sort_order?: number
          soul_reward?: number
          target?: number
          title_reward?: string | null
          xp_reward?: number
        }
        Update: {
          category?: string
          desc_ar?: string
          desc_en?: string
          id?: string
          name_ar?: string
          name_en?: string
          rarity?: string
          sort_order?: number
          soul_reward?: number
          target?: number
          title_reward?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      bleachdle_daily: {
        Row: {
          character_id: string
          created_at: string
          day_key: string
          puzzle_number: number
        }
        Insert: {
          character_id: string
          created_at?: string
          day_key: string
          puzzle_number: number
        }
        Update: {
          character_id?: string
          created_at?: string
          day_key?: string
          puzzle_number?: number
        }
        Relationships: []
      }
      bleachdle_solves: {
        Row: {
          day_key: string
          guesses: number
          solved_at: string
          souls_awarded: number
          user_id: string
          won: boolean
        }
        Insert: {
          day_key: string
          guesses: number
          solved_at?: string
          souls_awarded?: number
          user_id: string
          won: boolean
        }
        Update: {
          day_key?: string
          guesses?: number
          solved_at?: string
          souls_awarded?: number
          user_id?: string
          won?: boolean
        }
        Relationships: []
      }
      bleachdle_stats: {
        Row: {
          best_streak: number
          current_streak: number
          fastest_solve: number | null
          games_played: number
          games_won: number
          last_played_day: string | null
          total_guesses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          fastest_solve?: number | null
          games_played?: number
          games_won?: number
          last_played_day?: string | null
          total_guesses?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          fastest_solve?: number | null
          games_played?: number
          games_won?: number
          last_played_day?: string | null
          total_guesses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      characters_catalog: {
        Row: {
          id: string
          overall: number
          rarity: string
        }
        Insert: {
          id: string
          overall: number
          rarity: string
        }
        Update: {
          id?: string
          overall?: number
          rarity?: string
        }
        Relationships: []
      }
      daily_login: {
        Row: {
          last_claim_day: string | null
          streak: number
          total_claims: number
          updated_at: string
          user_id: string
        }
        Insert: {
          last_claim_day?: string | null
          streak?: number
          total_claims?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          last_claim_day?: string | null
          streak?: number
          total_claims?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_scores: {
        Row: {
          id: string
          score: number
          season_key: string
          submitted_at: string
          team: Json
          user_id: string
        }
        Insert: {
          id?: string
          score: number
          season_key: string
          submitted_at?: string
          team?: Json
          user_id: string
        }
        Update: {
          id?: string
          score?: number
          season_key?: string
          submitted_at?: string
          team?: Json
          user_id?: string
        }
        Relationships: []
      }
      level_rewards_claimed: {
        Row: {
          claimed_at: string
          level: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          level: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          level?: number
          user_id?: string
        }
        Relationships: []
      }
      level_rewards_config: {
        Row: {
          badge_item: string | null
          border_item: string | null
          color_item: string | null
          frame_item: string | null
          level: number
          name_ar: string
          name_en: string
          souls: number
          title_item: string | null
        }
        Insert: {
          badge_item?: string | null
          border_item?: string | null
          color_item?: string | null
          frame_item?: string | null
          level: number
          name_ar: string
          name_en: string
          souls?: number
          title_item?: string | null
        }
        Update: {
          badge_item?: string | null
          border_item?: string | null
          color_item?: string | null
          frame_item?: string | null
          level?: number
          name_ar?: string
          name_en?: string
          souls?: number
          title_item?: string | null
        }
        Relationships: []
      }
      mission_defs: {
        Row: {
          id: string
          reward_souls: number
          sort_order: number
          target: number
        }
        Insert: {
          id: string
          reward_souls: number
          sort_order?: number
          target: number
        }
        Update: {
          id?: string
          reward_souls?: number
          sort_order?: number
          target?: number
        }
        Relationships: []
      }
      player_levels: {
        Row: {
          level: number
          total_xp: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          level?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          level?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_character_id: string | null
          best_draft_score: number
          created_at: string
          drafts_played: number
          email: string | null
          favorite_character_id: string | null
          highest_rival_rating: number
          packs_opened: number
          play_seconds: number
          profile_border: string | null
          profile_frame: string | null
          souls: number
          title: string | null
          total_souls_earned: number
          updated_at: string
          user_id: string
          username: string | null
          username_color: string | null
        }
        Insert: {
          avatar_character_id?: string | null
          best_draft_score?: number
          created_at?: string
          drafts_played?: number
          email?: string | null
          favorite_character_id?: string | null
          highest_rival_rating?: number
          packs_opened?: number
          play_seconds?: number
          profile_border?: string | null
          profile_frame?: string | null
          souls?: number
          title?: string | null
          total_souls_earned?: number
          updated_at?: string
          user_id: string
          username?: string | null
          username_color?: string | null
        }
        Update: {
          avatar_character_id?: string | null
          best_draft_score?: number
          created_at?: string
          drafts_played?: number
          email?: string | null
          favorite_character_id?: string | null
          highest_rival_rating?: number
          packs_opened?: number
          play_seconds?: number
          profile_border?: string | null
          profile_frame?: string | null
          souls?: number
          title?: string | null
          total_souls_earned?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          username_color?: string | null
        }
        Relationships: []
      }
      rival_battles: {
        Row: {
          attacker_delta: number
          attacker_id: string
          attacker_score: number
          attacker_team: Json
          created_at: string
          defender_delta: number
          defender_id: string
          defender_score: number
          defender_team: Json
          id: string
          winner_id: string | null
        }
        Insert: {
          attacker_delta?: number
          attacker_id: string
          attacker_score: number
          attacker_team?: Json
          created_at?: string
          defender_delta?: number
          defender_id: string
          defender_score: number
          defender_team?: Json
          id?: string
          winner_id?: string | null
        }
        Update: {
          attacker_delta?: number
          attacker_id?: string
          attacker_score?: number
          attacker_team?: Json
          created_at?: string
          defender_delta?: number
          defender_id?: string
          defender_score?: number
          defender_team?: Json
          id?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      rival_stats: {
        Row: {
          battles_day: string
          battles_today: number
          losses: number
          rating: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          battles_day?: string
          battles_today?: number
          losses?: number
          rating?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          battles_day?: string
          battles_today?: number
          losses?: number
          rating?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: []
      }
      rival_teams: {
        Row: {
          slots: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          slots?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          slots?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_items: {
        Row: {
          active: boolean
          cost: number
          created_at: string
          id: string
          kind: string
          meta: Json
          name_ar: string
          name_en: string
          purchasable: boolean
          sort_order: number
        }
        Insert: {
          active?: boolean
          cost: number
          created_at?: string
          id: string
          kind: string
          meta?: Json
          name_ar: string
          name_en: string
          purchasable?: boolean
          sort_order?: number
        }
        Update: {
          active?: boolean
          cost?: number
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          name_ar?: string
          name_en?: string
          purchasable?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          progress: number
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          progress?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          progress?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      user_collection: {
        Row: {
          character_id: string
          count: number
          first_obtained_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          count?: number
          first_obtained_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          count?: number
          first_obtained_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_collection_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mission_progress: {
        Row: {
          claimed: boolean
          day_key: string
          mission_id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          day_key: string
          mission_id: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          day_key?: string
          mission_id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_packs: {
        Row: {
          count: number
          tier: string
          user_id: string
        }
        Insert: {
          count?: number
          tier: string
          user_id: string
        }
        Update: {
          count?: number
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reward_claims: {
        Row: {
          claimed_at: string
          pack_tier: string | null
          rank: number
          season_key: string
          souls_awarded: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          pack_tier?: string | null
          rank: number
          season_key: string
          souls_awarded?: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          pack_tier?: string | null
          rank?: number
          season_key?: string
          souls_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: { Args: { p_amount: number; p_source?: string }; Returns: Json }
      award_pack_from_score: { Args: { p_score: number }; Returns: Json }
      battle_rival: { Args: { p_opponent: string }; Returns: Json }
      claim_daily_login: { Args: never; Returns: Json }
      claim_level_reward: { Args: { p_level: number }; Returns: Json }
      claim_mission: { Args: { p_mission_id: string }; Returns: Json }
      claim_weekly_reward: { Args: never; Returns: Json }
      current_day_key: { Args: never; Returns: string }
      current_season_key: { Args: never; Returns: string }
      equip_item: { Args: { p_item_id: string; p_kind: string }; Returns: Json }
      find_rival_opponent: { Args: never; Returns: Json }
      get_bleachdle_today: { Args: { p_candidates: string[] }; Returns: Json }
      get_daily_login_state: { Args: never; Returns: Json }
      get_leaderboard: {
        Args: { p_limit?: number; p_season?: string }
        Returns: {
          rank: number
          score: number
          team: Json
          title: string
          user_id: string
          username: string
          username_color: string
        }[]
      }
      get_level_rewards_state: {
        Args: never
        Returns: {
          badge_item: string
          border_item: string
          claimed: boolean
          color_item: string
          frame_item: string
          level: number
          name_ar: string
          name_en: string
          souls: number
          title_item: string
          unlocked: boolean
        }[]
      }
      get_my_achievements: {
        Args: never
        Returns: {
          category: string
          desc_ar: string
          desc_en: string
          id: string
          name_ar: string
          name_en: string
          progress: number
          rarity: string
          sort_order: number
          soul_reward: number
          target: number
          title_reward: string
          unlocked_at: string
          xp_reward: number
        }[]
      }
      get_my_bleachdle_stats: { Args: never; Returns: Json }
      get_my_collection: {
        Args: never
        Returns: {
          character_id: string
          count: number
          first_obtained_at: string
          overall: number
          rarity: string
        }[]
      }
      get_my_inventory: {
        Args: never
        Returns: {
          acquired_at: string
          item_id: string
          kind: string
          meta: Json
          name_ar: string
          name_en: string
        }[]
      }
      get_my_missions: {
        Args: never
        Returns: {
          claimed: boolean
          mission_id: string
          progress: number
          reward_souls: number
          sort_order: number
          target: number
        }[]
      }
      get_my_packs: {
        Args: never
        Returns: {
          count: number
          tier: string
        }[]
      }
      get_my_profile_full: { Args: never; Returns: Json }
      get_my_recent_battles: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          i_lost: boolean
          i_won: boolean
          id: string
          my_delta: number
          my_score: number
          opp_score: number
          opponent_id: string
          opponent_name: string
        }[]
      }
      get_my_rival_stats: { Args: never; Returns: Json }
      get_my_rival_team: { Args: never; Returns: Json }
      get_my_weekly_reward: { Args: never; Returns: Json }
      get_public_profile: { Args: { p_user_id: string }; Returns: Json }
      get_rival_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          losses: number
          rank: number
          rating: number
          title: string
          user_id: string
          username: string
          username_color: string
          wins: number
        }[]
      }
      get_store: {
        Args: never
        Returns: {
          cost: number
          id: string
          kind: string
          meta: Json
          name_ar: string
          name_en: string
          owned: boolean
          sort_order: number
        }[]
      }
      grant_item: {
        Args: { p_item_id: string; p_user: string }
        Returns: undefined
      }
      open_pack: { Args: { p_tier: string }; Returns: Json }
      pack_tier_from_score: { Args: { p_score: number }; Returns: string }
      previous_season_key: { Args: never; Returns: string }
      purchase_item: { Args: { p_item_id: string }; Returns: Json }
      set_avatar: { Args: { p_character_id: string }; Returns: Json }
      set_favorite: { Args: { p_character_id: string }; Returns: Json }
      set_rival_team: { Args: { p_slots: Json }; Returns: Json }
      set_username: { Args: { p_username: string }; Returns: Json }
      submit_bleachdle: {
        Args: { p_day: string; p_guesses: number; p_won: boolean }
        Returns: Json
      }
      submit_score:
        | { Args: { p_score: number }; Returns: Json }
        | { Args: { p_score: number; p_team?: Json }; Returns: Json }
      track_achievement: {
        Args: { p_absolute?: boolean; p_id: string; p_progress?: number }
        Returns: Json
      }
      track_mission: {
        Args: { p_increment?: number; p_mission_id: string }
        Returns: Json
      }
      weekly_reward_for_rank: { Args: { p_rank: number }; Returns: Json }
      xp_for_level: { Args: { p_level: number }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
