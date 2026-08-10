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
      active_potions: {
        Row: {
          created_at: string
          expires_at: string
          item_id: string
          luck: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          item_id: string
          luck: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          item_id?: string
          luck?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_potions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
        ]
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
          gender: string
          id: string
          overall: number
          rarity: string
        }
        Insert: {
          gender?: string
          id: string
          overall: number
          rarity: string
        }
        Update: {
          gender?: string
          id?: string
          overall?: number
          rarity?: string
        }
        Relationships: []
      }
      clan_join_requests: {
        Row: {
          clan_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_join_requests_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          joined_at: string
          role: Database["public"]["Enums"]["clan_role"]
          user_id: string
        }
        Insert: {
          clan_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["clan_role"]
          user_id: string
        }
        Update: {
          clan_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["clan_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_messages: {
        Row: {
          clan_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          clan_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_messages_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_weekly_reward_claims: {
        Row: {
          claimed_at: string
          clan_id: string
          pack_tier: string | null
          rank: number
          season_key: string
          souls_awarded: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          clan_id: string
          pack_tier?: string | null
          rank: number
          season_key: string
          souls_awarded?: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          clan_id?: string
          pack_tier?: string | null
          rank?: number
          season_key?: string
          souls_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      clans: {
        Row: {
          created_at: string
          description: string
          id: string
          leader_id: string
          member_count: number
          name: string
          tag: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          leader_id: string
          member_count?: number
          name: string
          tag: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          leader_id?: string
          member_count?: number
          name?: string
          tag?: string
          updated_at?: string
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
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      duel_forge: {
        Row: {
          equipped_weapon: string
          fragments: number
          updated_at: string
          user_id: string
        }
        Insert: {
          equipped_weapon?: string
          fragments?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          equipped_weapon?: string
          fragments?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      duel_matches: {
        Row: {
          created_at: string
          guest_id: string | null
          guest_moves: Json | null
          guest_ready: boolean
          host_id: string
          host_ready: boolean
          id: string
          state: Json | null
          status: string
          updated_at: string
          winner: string | null
        }
        Insert: {
          created_at?: string
          guest_id?: string | null
          guest_moves?: Json | null
          guest_ready?: boolean
          host_id: string
          host_ready?: boolean
          id?: string
          state?: Json | null
          status?: string
          updated_at?: string
          winner?: string | null
        }
        Update: {
          created_at?: string
          guest_id?: string | null
          guest_moves?: Json | null
          guest_ready?: boolean
          host_id?: string
          host_ready?: boolean
          id?: string
          state?: Json | null
          status?: string
          updated_at?: string
          winner?: string | null
        }
        Relationships: []
      }
      duel_ranks: {
        Row: {
          draws: number
          losses: number
          rating: number
          updated_at: string
          user_id: string
          week_start: string
          wins: number
        }
        Insert: {
          draws?: number
          losses?: number
          rating?: number
          updated_at?: string
          user_id: string
          week_start?: string
          wins?: number
        }
        Update: {
          draws?: number
          losses?: number
          rating?: number
          updated_at?: string
          user_id?: string
          week_start?: string
          wins?: number
        }
        Relationships: []
      }
      duel_weapon_catalog: {
        Row: {
          fragment_cost: number
          soul_cost: number
          starter: boolean
          weapon_id: string
        }
        Insert: {
          fragment_cost: number
          soul_cost: number
          starter?: boolean
          weapon_id: string
        }
        Update: {
          fragment_cost?: number
          soul_cost?: number
          starter?: boolean
          weapon_id?: string
        }
        Relationships: []
      }
      duel_weapons: {
        Row: {
          unlocked_at: string
          user_id: string
          weapon_id: string
        }
        Insert: {
          unlocked_at?: string
          user_id: string
          weapon_id: string
        }
        Update: {
          unlocked_at?: string
          user_id?: string
          weapon_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friend_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friend_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friend_status"]
          updated_at?: string
        }
        Relationships: []
      }
      global_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
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
          name_frame_item: string | null
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
          name_frame_item?: string | null
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
          name_frame_item?: string | null
          souls?: number
          title_item?: string | null
        }
        Relationships: []
      }
      mission_defs: {
        Row: {
          active: boolean
          difficulty: string
          event_key: string | null
          id: string
          name_ar: string | null
          name_en: string | null
          reward_souls: number
          sort_order: number
          target: number
        }
        Insert: {
          active?: boolean
          difficulty?: string
          event_key?: string | null
          id: string
          name_ar?: string | null
          name_en?: string | null
          reward_souls: number
          sort_order?: number
          target: number
        }
        Update: {
          active?: boolean
          difficulty?: string
          event_key?: string | null
          id?: string
          name_ar?: string | null
          name_en?: string | null
          reward_souls?: number
          sort_order?: number
          target?: number
        }
        Relationships: []
      }
      news: {
        Row: {
          body_ar: string
          body_en: string
          category: string
          created_at: string
          dedupe_key: string | null
          id: string
          pinned: boolean
          published_at: string
          title_ar: string
          title_en: string
        }
        Insert: {
          body_ar: string
          body_en: string
          category?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          pinned?: boolean
          published_at?: string
          title_ar: string
          title_en: string
        }
        Update: {
          body_ar?: string
          body_en?: string
          category?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          pinned?: boolean
          published_at?: string
          title_ar?: string
          title_en?: string
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
          clan_id: string | null
          created_at: string
          drafts_played: number
          email: string | null
          favorite_character_id: string | null
          highest_rival_rating: number
          name_frame: string | null
          packs_opened: number
          play_seconds: number
          profile_border: string | null
          profile_frame: string | null
          referral_code: string | null
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
          clan_id?: string | null
          created_at?: string
          drafts_played?: number
          email?: string | null
          favorite_character_id?: string | null
          highest_rival_rating?: number
          name_frame?: string | null
          packs_opened?: number
          play_seconds?: number
          profile_border?: string | null
          profile_frame?: string | null
          referral_code?: string | null
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
          clan_id?: string | null
          created_at?: string
          drafts_played?: number
          email?: string | null
          favorite_character_id?: string | null
          highest_rival_rating?: number
          name_frame?: string | null
          packs_opened?: number
          play_seconds?: number
          profile_border?: string | null
          profile_frame?: string | null
          referral_code?: string | null
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
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          packs_awarded: number
          referred_id: string
          referrer_id: string
          souls_awarded: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          packs_awarded?: number
          referred_id: string
          referrer_id: string
          souls_awarded?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          packs_awarded?: number
          referred_id?: string
          referrer_id?: string
          souls_awarded?: number
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
      rival_daily_matches: {
        Row: {
          attacker_id: string
          created_at: string
          day: string
          defender_id: string
        }
        Insert: {
          attacker_id: string
          created_at?: string
          day?: string
          defender_id: string
        }
        Update: {
          attacker_id?: string
          created_at?: string
          day?: string
          defender_id?: string
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
      user_daily_missions: {
        Row: {
          created_at: string
          day_key: string
          mission_ids: string[]
          rerolls_used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day_key: string
          mission_ids: string[]
          rerolls_used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          day_key?: string
          mission_ids?: string[]
          rerolls_used?: number
          user_id?: string
        }
        Relationships: []
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
      user_potions: {
        Row: {
          count: number
          created_at: string
          item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_potions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
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
      activate_potion: { Args: { p_item_id: string }; Returns: Json }
      add_xp: { Args: { p_amount: number; p_source?: string }; Returns: Json }
      award_fragments: { Args: { p_amount: number }; Returns: Json }
      award_pack_from_score: { Args: { p_score: number }; Returns: Json }
      battle_rival: { Args: { p_opponent: string }; Returns: Json }
      cancel_join_request: { Args: { p_clan_id: string }; Returns: Json }
      claim_clan_weekly_reward: { Args: never; Returns: Json }
      claim_daily_login: { Args: never; Returns: Json }
      claim_level_reward: { Args: { p_level: number }; Returns: Json }
      claim_mission: { Args: { p_mission_id: string }; Returns: Json }
      claim_weekly_reward: { Args: never; Returns: Json }
      clan_weekly_reward_for_rank: { Args: { p_rank: number }; Returns: Json }
      create_clan: {
        Args: { p_description?: string; p_name: string; p_tag: string }
        Returns: Json
      }
      current_day_key: { Args: never; Returns: string }
      current_season_key: { Args: never; Returns: string }
      delete_global_message: { Args: { p_id: string }; Returns: Json }
      disband_clan: { Args: never; Returns: Json }
      duel_find_match: {
        Args: never
        Returns: {
          created_at: string
          guest_id: string | null
          guest_moves: Json | null
          guest_ready: boolean
          host_id: string
          host_ready: boolean
          id: string
          state: Json | null
          status: string
          updated_at: string
          winner: string | null
        }
        SetofOptions: {
          from: "*"
          to: "duel_matches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      duel_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_character_id: string
          draws: number
          losses: number
          name_frame: string
          rating: number
          user_id: string
          username: string
          username_color: string
          wins: number
        }[]
      }
      duel_leave_match: { Args: { p_match: string }; Returns: undefined }
      duel_report_result: {
        Args: { p_match: string; p_winner: string }
        Returns: undefined
      }
      duel_week_start: { Args: never; Returns: string }
      ensure_daily_missions: { Args: never; Returns: string[] }
      ensure_weekly_announcement: { Args: never; Returns: undefined }
      equip_item: { Args: { p_item_id: string; p_kind: string }; Returns: Json }
      equip_weapon: { Args: { p_weapon_id: string }; Returns: Json }
      find_rival_opponent: { Args: never; Returns: Json }
      forge_weapon: { Args: { p_weapon_id: string }; Returns: Json }
      get_active_potion: { Args: never; Returns: Json }
      get_bleachdle_today: { Args: { p_candidates: string[] }; Returns: Json }
      get_clan_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          member_count: number
          name: string
          rank: number
          tag: string
          total_level: number
          total_rating: number
        }[]
      }
      get_clan_messages: {
        Args: { p_limit?: number }
        Returns: {
          avatar_character_id: string
          content: string
          created_at: string
          id: string
          user_id: string
          username: string
          username_color: string
        }[]
      }
      get_clan_weekly_leaderboard: {
        Args: { p_limit?: number; p_season?: string }
        Returns: {
          id: string
          member_count: number
          name: string
          rank: number
          scoring_members: number
          tag: string
          total_score: number
        }[]
      }
      get_daily_login_state: { Args: never; Returns: Json }
      get_direct_messages: {
        Args: { p_limit?: number; p_other: string }
        Returns: {
          content: string
          created_at: string
          id: string
          read_at: string
          recipient_id: string
          sender_id: string
        }[]
      }
      get_forge: { Args: never; Returns: Json }
      get_friend_status: { Args: { p_other: string }; Returns: Json }
      get_global_messages: {
        Args: { p_limit?: number }
        Returns: {
          avatar_character_id: string
          content: string
          created_at: string
          id: string
          name_frame: string
          title: string
          user_id: string
          username: string
          username_color: string
        }[]
      }
      get_leaderboard: {
        Args: { p_limit?: number; p_season?: string }
        Returns: {
          avatar_character_id: string
          name_frame: string
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
          name_frame_item: string
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
      get_my_clan: { Args: never; Returns: Json }
      get_my_clan_weekly_reward: { Args: never; Returns: Json }
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
      get_my_conversations: {
        Args: never
        Returns: {
          avatar_character_id: string
          last_at: string
          last_message: string
          name_frame: string
          unread: number
          user_id: string
          username: string
          username_color: string
        }[]
      }
      get_my_friend_requests: {
        Args: never
        Returns: {
          avatar_character_id: string
          created_at: string
          direction: string
          id: string
          profile_frame: string
          title: string
          user_id: string
          username: string
          username_color: string
        }[]
      }
      get_my_friends: {
        Args: never
        Returns: {
          avatar_character_id: string
          friended_at: string
          level: number
          profile_frame: string
          rival_rating: number
          title: string
          user_id: string
          username: string
          username_color: string
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
          difficulty: string
          event_key: string
          mission_id: string
          name_ar: string
          name_en: string
          progress: number
          rerolls_left: number
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
      get_my_potions: {
        Args: never
        Returns: {
          count: number
          item_id: string
          luck: number
          minutes: number
          name_ar: string
          name_en: string
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
      get_my_referral: { Args: never; Returns: Json }
      get_my_rival_stats: { Args: never; Returns: Json }
      get_my_rival_team: { Args: never; Returns: Json }
      get_my_weekly_reward: { Args: never; Returns: Json }
      get_news: {
        Args: { p_limit?: number }
        Returns: {
          body_ar: string
          body_en: string
          category: string
          id: string
          pinned: boolean
          published_at: string
          title_ar: string
          title_en: string
        }[]
      }
      get_public_profile: { Args: { p_user_id: string }; Returns: Json }
      get_rival_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_character_id: string
          losses: number
          name_frame: string
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
      get_unread_dm_count: { Args: never; Returns: number }
      grant_item: {
        Args: { p_item_id: string; p_user: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      kick_clan_member: { Args: { p_user_id: string }; Returns: Json }
      leave_clan: { Args: never; Returns: Json }
      list_clans: {
        Args: { p_limit?: number; p_query?: string }
        Returns: {
          created_at: string
          description: string
          id: string
          member_count: number
          my_request: boolean
          name: string
          tag: string
          total_level: number
        }[]
      }
      mark_conversation_read: { Args: { p_other: string }; Returns: Json }
      my_clan_id: { Args: never; Returns: string }
      my_clan_role: {
        Args: never
        Returns: Database["public"]["Enums"]["clan_role"]
      }
      open_all_packs: { Args: { p_tier: string }; Returns: Json }
      open_pack: { Args: { p_tier: string }; Returns: Json }
      pack_tier_from_score: { Args: { p_score: number }; Returns: string }
      previous_season_key: { Args: never; Returns: string }
      purchase_item: { Args: { p_item_id: string }; Returns: Json }
      redeem_referral: { Args: { p_code: string }; Returns: Json }
      remove_friend: { Args: { p_other: string }; Returns: Json }
      request_join_clan: { Args: { p_clan_id: string }; Returns: Json }
      reroll_mission: { Args: { p_mission_id: string }; Returns: Json }
      respond_friend_request: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: Json
      }
      respond_join_request: {
        Args: { p_accept: boolean; p_user_id: string }
        Returns: Json
      }
      search_users: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          avatar_character_id: string
          level: number
          profile_frame: string
          title: string
          user_id: string
          username: string
          username_color: string
        }[]
      }
      send_clan_message: { Args: { p_content: string }; Returns: Json }
      send_direct_message: {
        Args: { p_content: string; p_to: string }
        Returns: Json
      }
      send_friend_request: { Args: { p_addressee: string }; Returns: Json }
      send_global_message: { Args: { p_content: string }; Returns: Json }
      set_avatar: { Args: { p_character_id: string }; Returns: Json }
      set_clan_member_role: {
        Args: {
          p_role: Database["public"]["Enums"]["clan_role"]
          p_user_id: string
        }
        Returns: Json
      }
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
      transfer_clan_leadership: { Args: { p_user_id: string }; Returns: Json }
      update_clan_description: {
        Args: { p_description: string }
        Returns: Json
      }
      weekly_reward_for_rank: { Args: { p_rank: number }; Returns: Json }
      xp_for_level: { Args: { p_level: number }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      clan_role: "leader" | "officer" | "member"
      friend_status: "pending" | "accepted"
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
      app_role: ["admin", "moderator", "user"],
      clan_role: ["leader", "officer", "member"],
      friend_status: ["pending", "accepted"],
    },
  },
} as const
