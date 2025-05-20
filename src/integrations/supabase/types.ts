export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      social_metrics_cache: {
        Row: {
          created_at: string
          followers_count: number
          id: string
          last_updated: string
          previous_count: number
          twitter_handle: string
        }
        Insert: {
          created_at?: string
          followers_count?: number
          id?: string
          last_updated?: string
          previous_count?: number
          twitter_handle: string
        }
        Update: {
          created_at?: string
          followers_count?: number
          id?: string
          last_updated?: string
          previous_count?: number
          twitter_handle?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          scan_count: number | null
          scan_limit: number | null
          scan_reset_date: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          scan_count?: number | null
          scan_limit?: number | null
          scan_reset_date?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          scan_count?: number | null
          scan_limit?: number | null
          scan_reset_date?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      token_community_cache: {
        Row: {
          active_channels: string | null
          active_channels_count: number | null
          community_score: number | null
          created_at: string
          growth_rate: string | null
          growth_rate_value: number | null
          id: string
          last_updated: string
          social_followers: string | null
          social_followers_change: number | null
          social_followers_count: number | null
          team_visibility: string | null
          token_id: string
          verified_account: string | null
        }
        Insert: {
          active_channels?: string | null
          active_channels_count?: number | null
          community_score?: number | null
          created_at?: string
          growth_rate?: string | null
          growth_rate_value?: number | null
          id?: string
          last_updated?: string
          social_followers?: string | null
          social_followers_change?: number | null
          social_followers_count?: number | null
          team_visibility?: string | null
          token_id: string
          verified_account?: string | null
        }
        Update: {
          active_channels?: string | null
          active_channels_count?: number | null
          community_score?: number | null
          created_at?: string
          growth_rate?: string | null
          growth_rate_value?: number | null
          id?: string
          last_updated?: string
          social_followers?: string | null
          social_followers_change?: number | null
          social_followers_count?: number | null
          team_visibility?: string | null
          token_id?: string
          verified_account?: string | null
        }
        Relationships: []
      }
      token_data_cache: {
        Row: {
          data: Json
          expires_at: string
          last_updated: string | null
          token_id: string
        }
        Insert: {
          data: Json
          expires_at: string
          last_updated?: string | null
          token_id: string
        }
        Update: {
          data?: Json
          expires_at?: string
          last_updated?: string | null
          token_id?: string
        }
        Relationships: []
      }
      token_development_cache: {
        Row: {
          created_at: string
          development_score: number | null
          github_activity: string | null
          github_commits: number | null
          github_contributors: number | null
          id: string
          last_commit_date: string | null
          last_updated: string
          token_id: string
        }
        Insert: {
          created_at?: string
          development_score?: number | null
          github_activity?: string | null
          github_commits?: number | null
          github_contributors?: number | null
          id?: string
          last_commit_date?: string | null
          last_updated?: string
          token_id: string
        }
        Update: {
          created_at?: string
          development_score?: number | null
          github_activity?: string | null
          github_commits?: number | null
          github_contributors?: number | null
          id?: string
          last_commit_date?: string | null
          last_updated?: string
          token_id?: string
        }
        Relationships: []
      }
      token_holders_cache: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          percentage: string
          token_address: string
          trend: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          percentage: string
          token_address: string
          trend?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          percentage?: string
          token_address?: string
          trend?: string | null
          value?: number
        }
        Relationships: []
      }
      token_liquidity_cache: {
        Row: {
          cex_listings: string | null
          created_at: string
          dex_depth: string | null
          dex_depth_value: number | null
          holder_distribution: string | null
          holder_distribution_value: number | null
          id: string
          last_updated: string
          liquidity_lock: string | null
          liquidity_lock_days: number | null
          liquidity_score: number | null
          token_id: string
          trading_volume_24h: number | null
          trading_volume_change_24h: number | null
          trading_volume_formatted: string | null
        }
        Insert: {
          cex_listings?: string | null
          created_at?: string
          dex_depth?: string | null
          dex_depth_value?: number | null
          holder_distribution?: string | null
          holder_distribution_value?: number | null
          id?: string
          last_updated?: string
          liquidity_lock?: string | null
          liquidity_lock_days?: number | null
          liquidity_score?: number | null
          token_id: string
          trading_volume_24h?: number | null
          trading_volume_change_24h?: number | null
          trading_volume_formatted?: string | null
        }
        Update: {
          cex_listings?: string | null
          created_at?: string
          dex_depth?: string | null
          dex_depth_value?: number | null
          holder_distribution?: string | null
          holder_distribution_value?: number | null
          id?: string
          last_updated?: string
          liquidity_lock?: string | null
          liquidity_lock_days?: number | null
          liquidity_score?: number | null
          token_id?: string
          trading_volume_24h?: number | null
          trading_volume_change_24h?: number | null
          trading_volume_formatted?: string | null
        }
        Relationships: []
      }
      token_metrics_cache: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          metrics: Json
          token_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          metrics: Json
          token_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          metrics?: Json
          token_id?: string
        }
        Relationships: []
      }
      token_scans: {
        Row: {
          category_scores: Json | null
          created_at: string | null
          health_score: number | null
          id: string
          metadata: Json | null
          token_address: string | null
          token_id: string
          token_name: string | null
          token_symbol: string
          user_id: string | null
        }
        Insert: {
          category_scores?: Json | null
          created_at?: string | null
          health_score?: number | null
          id?: string
          metadata?: Json | null
          token_address?: string | null
          token_id: string
          token_name?: string | null
          token_symbol: string
          user_id?: string | null
        }
        Update: {
          category_scores?: Json | null
          created_at?: string | null
          health_score?: number | null
          id?: string
          metadata?: Json | null
          token_address?: string | null
          token_id?: string
          token_name?: string | null
          token_symbol?: string
          user_id?: string | null
        }
        Relationships: []
      }
      token_security_cache: {
        Row: {
          bug_bounty: string | null
          code_audit: string | null
          created_at: string
          freeze_authority: string | null
          id: string
          last_updated: string
          multi_sig_wallet: string | null
          ownership_renounced: string | null
          security_score: number | null
          token_id: string
        }
        Insert: {
          bug_bounty?: string | null
          code_audit?: string | null
          created_at?: string
          freeze_authority?: string | null
          id?: string
          last_updated?: string
          multi_sig_wallet?: string | null
          ownership_renounced?: string | null
          security_score?: number | null
          token_id: string
        }
        Update: {
          bug_bounty?: string | null
          code_audit?: string | null
          created_at?: string
          freeze_authority?: string | null
          id?: string
          last_updated?: string
          multi_sig_wallet?: string | null
          ownership_renounced?: string | null
          security_score?: number | null
          token_id?: string
        }
        Relationships: []
      }
      token_tokenomics_cache: {
        Row: {
          burn_mechanism: string | null
          created_at: string
          id: string
          last_updated: string
          supply_cap_exists: boolean | null
          supply_cap_formatted: string | null
          supply_cap_value: number | null
          token_distribution_formatted: string | null
          token_distribution_rating: string | null
          token_distribution_value: number | null
          token_id: string
          tokenomics_score: number | null
          treasury_size_formatted: string | null
          treasury_size_value: number | null
          tvl_change_24h: number | null
          tvl_formatted: string | null
          tvl_value: number | null
        }
        Insert: {
          burn_mechanism?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          supply_cap_exists?: boolean | null
          supply_cap_formatted?: string | null
          supply_cap_value?: number | null
          token_distribution_formatted?: string | null
          token_distribution_rating?: string | null
          token_distribution_value?: number | null
          token_id: string
          tokenomics_score?: number | null
          treasury_size_formatted?: string | null
          treasury_size_value?: number | null
          tvl_change_24h?: number | null
          tvl_formatted?: string | null
          tvl_value?: number | null
        }
        Update: {
          burn_mechanism?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          supply_cap_exists?: boolean | null
          supply_cap_formatted?: string | null
          supply_cap_value?: number | null
          token_distribution_formatted?: string | null
          token_distribution_rating?: string | null
          token_distribution_value?: number | null
          token_id?: string
          tokenomics_score?: number | null
          treasury_size_formatted?: string | null
          treasury_size_value?: number | null
          tvl_change_24h?: number | null
          tvl_formatted?: string | null
          tvl_value?: number | null
        }
        Relationships: []
      }
      twitter_profile_cache: {
        Row: {
          fetched_at: string
          id: string
          profile_data: Json
          updated_at: string
          username: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          profile_data: Json
          updated_at?: string
          username: string
        }
        Update: {
          fetched_at?: string
          id?: string
          profile_data?: Json
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_token_holders_cache_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
