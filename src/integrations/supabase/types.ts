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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          output_size: string
          product_id: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          output_size?: string
          product_id?: string | null
          template_id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          output_size?: string
          product_id?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_landings: {
        Row: {
          blocks: Json
          created_at: string
          id: string
          product_data: Json
          session_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          id?: string
          product_data?: Json
          session_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          id?: string
          product_data?: Json
          session_id?: string
        }
        Relationships: []
      }
      dropi_ad_generations: {
        Row: {
          created_at: string
          dropi_product_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dropi_product_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dropi_product_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropi_ad_generations_dropi_product_id_fkey"
            columns: ["dropi_product_id"]
            isOneToOne: false
            referencedRelation: "dropi_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dropi_products: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_2: string | null
          image_3: string | null
          image_main: string | null
          name: string
          updated_at: string
          video_2: string | null
          video_3: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_2?: string | null
          image_3?: string | null
          image_main?: string | null
          name: string
          updated_at?: string
          video_2?: string | null
          video_3?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_2?: string | null
          image_3?: string | null
          image_main?: string | null
          name?: string
          updated_at?: string
          video_2?: string | null
          video_3?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      email_automation_logs: {
        Row: {
          automation_id: string
          id: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          automation_id: string
          id?: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          automation_id?: string
          id?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automations: {
        Row: {
          body_html: string
          created_at: string
          delay_hours: number
          enabled: boolean
          id: string
          name: string
          subject: string
          trigger_event: string
        }
        Insert: {
          body_html: string
          created_at?: string
          delay_hours?: number
          enabled?: boolean
          id?: string
          name: string
          subject: string
          trigger_event: string
        }
        Update: {
          body_html?: string
          created_at?: string
          delay_hours?: number
          enabled?: boolean
          id?: string
          name?: string
          subject?: string
          trigger_event?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          audience: string
          body_html: string
          created_at: string
          created_by: string
          id: string
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
        }
        Insert: {
          audience?: string
          body_html: string
          created_at?: string
          created_by: string
          id?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
        }
        Update: {
          audience?: string
          body_html?: string
          created_at?: string
          created_by?: string
          id?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          campaign_id: string
          email: string
          id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          email: string
          id?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          email?: string
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_versions: {
        Row: {
          blocks: Json
          created_at: string
          id: string
          label: string | null
          landing_id: string
          theme: string
          user_id: string
          version_number: number
        }
        Insert: {
          blocks?: Json
          created_at?: string
          id?: string
          label?: string | null
          landing_id: string
          theme?: string
          user_id: string
          version_number?: number
        }
        Update: {
          blocks?: Json
          created_at?: string
          id?: string
          label?: string | null
          landing_id?: string
          theme?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "landing_versions_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "landings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_versions_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "public_landings"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_views: {
        Row: {
          id: string
          landing_id: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          landing_id: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          landing_id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_views_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "landings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_views_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "public_landings"
            referencedColumns: ["id"]
          },
        ]
      }
      landings: {
        Row: {
          blocks: Json
          created_at: string
          guarantee: string | null
          has_offer: boolean
          id: string
          intensity: Database["public"]["Enums"]["landing_intensity"]
          mode: Database["public"]["Enums"]["landing_mode"]
          name: string
          product_id: string
          published: boolean
          published_at: string | null
          slug: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          guarantee?: string | null
          has_offer?: boolean
          id?: string
          intensity?: Database["public"]["Enums"]["landing_intensity"]
          mode?: Database["public"]["Enums"]["landing_mode"]
          name: string
          product_id: string
          published?: boolean
          published_at?: string | null
          slug?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          guarantee?: string | null
          has_offer?: boolean
          id?: string
          intensity?: Database["public"]["Enums"]["landing_intensity"]
          mode?: Database["public"]["Enums"]["landing_mode"]
          name?: string
          product_id?: string
          published?: boolean
          published_at?: string | null
          slug?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          id: string
          payment_id: string
          processed_at: string | null
          raw_payload: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id: string
          processed_at?: string | null
          raw_payload?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string
          processed_at?: string | null
          raw_payload?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          period: string
          plan: string
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          period?: string
          plan: string
          provider?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          period?: string
          plan?: string
          provider?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      product_audiences: {
        Row: {
          audience_id: string
          id: string
          product_id: string
        }
        Insert: {
          audience_id: string
          id?: string
          product_id: string
        }
        Update: {
          audience_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_audiences_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "target_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_audiences_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string | null
          id: string
          images: string[]
          name: string
          price: number
          target_audience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name: string
          price: number
          target_audience: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name?: string
          price?: number
          target_audience?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banners_reset_at: string | null
          banners_used: number
          country_code: string | null
          created_at: string
          currency: string | null
          full_name: string | null
          id: string
          landings_reset_at: string | null
          landings_used: number
          language: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          plan_expires_at: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banners_reset_at?: string | null
          banners_used?: number
          country_code?: string | null
          created_at?: string
          currency?: string | null
          full_name?: string | null
          id?: string
          landings_reset_at?: string | null
          landings_used?: number
          language?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          plan_expires_at?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banners_reset_at?: string | null
          banners_used?: number
          country_code?: string | null
          created_at?: string
          currency?: string | null
          full_name?: string | null
          id?: string
          landings_reset_at?: string | null
          landings_used?: number
          language?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          plan_expires_at?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopify_connections: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          shop_name: string | null
          store_domain: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          shop_name?: string | null
          store_domain: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          shop_name?: string | null
          store_domain?: string
          user_id?: string
        }
        Relationships: []
      }
      shopify_oauth_states: {
        Row: {
          created_at: string
          id: string
          nonce: string
          store_domain: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nonce: string
          store_domain: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nonce?: string
          store_domain?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          payment_id: string | null
          plan_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan_id: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      target_audiences: {
        Row: {
          created_at: string
          id: string
          name: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          usage_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_banner_showcase: {
        Row: {
          created_at: string | null
          image_url: string | null
        }
        Relationships: []
      }
      public_landings: {
        Row: {
          blocks: Json | null
          created_at: string | null
          guarantee: string | null
          has_offer: boolean | null
          id: string | null
          intensity: Database["public"]["Enums"]["landing_intensity"] | null
          mode: Database["public"]["Enums"]["landing_mode"] | null
          name: string | null
          product_id: string | null
          published_at: string | null
          slug: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          blocks?: Json | null
          created_at?: string | null
          guarantee?: string | null
          has_offer?: boolean | null
          id?: string | null
          intensity?: Database["public"]["Enums"]["landing_intensity"] | null
          mode?: Database["public"]["Enums"]["landing_mode"] | null
          name?: string | null
          product_id?: string | null
          published_at?: string | null
          slug?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          blocks?: Json | null
          created_at?: string | null
          guarantee?: string | null
          has_offer?: boolean | null
          id?: string | null
          intensity?: Database["public"]["Enums"]["landing_intensity"] | null
          mode?: Database["public"]["Enums"]["landing_mode"] | null
          name?: string | null
          product_id?: string | null
          published_at?: string | null
          slug?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_connections_safe: {
        Row: {
          created_at: string | null
          id: string | null
          shop_name: string | null
          store_domain: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          shop_name?: string | null
          store_domain?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          shop_name?: string | null
          store_domain?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      app_role: "user" | "admin" | "super_admin"
      landing_intensity: "soft" | "medium" | "hard"
      landing_mode: "aida" | "standard"
      product_category: "home" | "fitness" | "beauty" | "gadget" | "pets"
      user_plan: "free" | "starter" | "pro"
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
      app_role: ["user", "admin", "super_admin"],
      landing_intensity: ["soft", "medium", "hard"],
      landing_mode: ["aida", "standard"],
      product_category: ["home", "fitness", "beauty", "gadget", "pets"],
      user_plan: ["free", "starter", "pro"],
    },
  },
} as const
