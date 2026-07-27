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
      profiles: {
        Row: {
          created_at: string
          email: string | null
          souls: number
          title: string | null
          updated_at: string
          user_id: string
          username: string | null
          username_color: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          souls?: number
          title?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          username_color?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          souls?: number
          title?: string | null
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
          sort_order?: number
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_pack_from_score: { Args: { p_score: number }; Returns: Json }
      battle_rival: { Args: { p_opponent: string }; Returns: Json }
      current_season_key: { Args: never; Returns: string }
      equip_item: { Args: { p_item_id: string; p_kind: string }; Returns: Json }
      find_rival_opponent: { Args: never; Returns: Json }
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
      get_my_packs: {
        Args: never
        Returns: {
          count: number
          tier: string
        }[]
      }
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
      open_pack: { Args: { p_tier: string }; Returns: Json }
      pack_tier_from_score: { Args: { p_score: number }; Returns: string }
      purchase_item: { Args: { p_item_id: string }; Returns: Json }
      set_rival_team: { Args: { p_slots: Json }; Returns: Json }
      set_username: { Args: { p_username: string }; Returns: Json }
      submit_score:
        | { Args: { p_score: number }; Returns: Json }
        | { Args: { p_score: number; p_team?: Json }; Returns: Json }
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
