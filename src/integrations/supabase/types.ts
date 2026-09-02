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
      alert_settings: {
        Row: {
          created_at: string
          min_impact: number
          news_enabled: boolean
          price_enabled: boolean
          price_threshold_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          min_impact?: number
          news_enabled?: boolean
          price_enabled?: boolean
          price_threshold_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          min_impact?: number
          news_enabled?: boolean
          price_enabled?: boolean
          price_threshold_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          article_id: string | null
          body: string | null
          change_pct: number | null
          created_at: string
          dedupe_key: string
          direction: string | null
          id: string
          is_read: boolean
          kind: string
          subject: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id?: string | null
          body?: string | null
          change_pct?: number | null
          created_at?: string
          dedupe_key: string
          direction?: string | null
          id?: string
          is_read?: boolean
          kind: string
          subject: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string | null
          body?: string | null
          change_pct?: number | null
          created_at?: string
          dedupe_key?: string
          direction?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          subject?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      hotspots: {
        Row: {
          id: string
          lat: number
          lng: number
          market_impact: string | null
          name: string
          region: string
          severity: number
          summary: string
          updated_at: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          market_impact?: string | null
          name: string
          region: string
          severity?: number
          summary: string
          updated_at?: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          market_impact?: string | null
          name?: string
          region?: string
          severity?: number
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      ipo_watchlist: {
        Row: {
          created_at: string
          id: string
          ipo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ipo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ipo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipo_watchlist_ipo_id_fkey"
            columns: ["ipo_id"]
            isOneToOne: false
            referencedRelation: "ipos"
            referencedColumns: ["id"]
          },
        ]
      }
      ipos: {
        Row: {
          analyst_note: string | null
          analyst_score: number | null
          board: string
          close_date: string | null
          created_at: string
          detail_url: string | null
          gmp: number | null
          id: string
          issue_size: string | null
          listing_date: string | null
          listing_gain_pct: number | null
          lot_size: number | null
          name: string
          open_date: string | null
          price_max: number | null
          price_min: number | null
          status: string
          subscription_x: number | null
          symbol: string | null
          updated_at: string
        }
        Insert: {
          analyst_note?: string | null
          analyst_score?: number | null
          board?: string
          close_date?: string | null
          created_at?: string
          detail_url?: string | null
          gmp?: number | null
          id?: string
          issue_size?: string | null
          listing_date?: string | null
          listing_gain_pct?: number | null
          lot_size?: number | null
          name: string
          open_date?: string | null
          price_max?: number | null
          price_min?: number | null
          status?: string
          subscription_x?: number | null
          symbol?: string | null
          updated_at?: string
        }
        Update: {
          analyst_note?: string | null
          analyst_score?: number | null
          board?: string
          close_date?: string | null
          created_at?: string
          detail_url?: string | null
          gmp?: number | null
          id?: string
          issue_size?: string | null
          listing_date?: string | null
          listing_gain_pct?: number | null
          lot_size?: number | null
          name?: string
          open_date?: string | null
          price_max?: number | null
          price_min?: number | null
          status?: string
          subscription_x?: number | null
          symbol?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          ai_summary: string | null
          category: string
          created_at: string
          hash: string
          id: string
          impact: number | null
          published_at: string
          regions: string[]
          sentiment: string | null
          source: string
          summary: string | null
          tickers: string[]
          title: string
          url: string
        }
        Insert: {
          ai_summary?: string | null
          category: string
          created_at?: string
          hash: string
          id?: string
          impact?: number | null
          published_at?: string
          regions?: string[]
          sentiment?: string | null
          source: string
          summary?: string | null
          tickers?: string[]
          title: string
          url: string
        }
        Update: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          hash?: string
          id?: string
          impact?: number | null
          published_at?: string
          regions?: string[]
          sentiment?: string | null
          source?: string
          summary?: string | null
          tickers?: string[]
          title?: string
          url?: string
        }
        Relationships: []
      }
      portfolio_positions: {
        Row: {
          avg_price: number
          created_at: string
          id: string
          label: string | null
          quantity: number
          symbol: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          created_at?: string
          id?: string
          label?: string | null
          quantity?: number
          symbol: string
          user_id: string
        }
        Update: {
          avg_price?: number
          created_at?: string
          id?: string
          label?: string | null
          quantity?: number
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickers: {
        Row: {
          alias: string
          change: number | null
          change_pct: number | null
          kind: string
          label: string
          last: number | null
          symbol: string
          updated_at: string
        }
        Insert: {
          alias: string
          change?: number | null
          change_pct?: number | null
          kind?: string
          label: string
          last?: number | null
          symbol: string
          updated_at?: string
        }
        Update: {
          alias?: string
          change?: number | null
          change_pct?: number | null
          kind?: string
          label?: string
          last?: number | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      derive_impact: { Args: { txt: string }; Returns: number }
      derive_regions: {
        Args: {
          _ai_summary: string
          _summary: string
          _tickers: string[]
          _title: string
        }
        Returns: string[]
      }
      derive_sentiment: { Args: { txt: string }; Returns: string }
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
