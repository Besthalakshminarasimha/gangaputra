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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_carousel_updates: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          media_type: string
          media_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_type: string
          media_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_type?: string
          media_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      answers: {
        Row: {
          content: string
          created_at: string
          id: string
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      carousel_analytics: {
        Row: {
          created_at: string
          id: string
          update_id: string
          user_id: string | null
          view_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          update_id: string
          user_id?: string | null
          view_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          update_id?: string
          user_id?: string | null
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "carousel_analytics_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "admin_carousel_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_manuals: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          id: string
          image_urls: string[] | null
          name: string
          slug: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          name: string
          slug: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          name?: string
          slug?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      daily_updates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          message: string
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message: string
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message?: string
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      diseases: {
        Row: {
          category: Database["public"]["Enums"]["disease_category"]
          created_at: string
          description: string | null
          id: string
          image_urls: string[] | null
          name: string
          prevention: string | null
          symptoms: string | null
          treatment: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["disease_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          name: string
          prevention?: string | null
          symptoms?: string | null
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["disease_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          name?: string
          prevention?: string | null
          symptoms?: string | null
          treatment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      farms: {
        Row: {
          created_at: string
          farm_name: string
          id: string
          location: string
          number_of_ponds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_name: string
          id?: string
          location: string
          number_of_ponds: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_name?: string
          id?: string
          location?: string
          number_of_ponds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hatcheries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          location: string
          name: string
          phone: string | null
          region: string
          species: string
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          name: string
          phone?: string | null
          region: string
          species: string
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          name?: string
          phone?: string | null
          region?: string
          species?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      magazines: {
        Row: {
          content: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          pdf_url: string | null
          published_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pdf_url?: string | null
          published_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pdf_url?: string | null
          published_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          active_ingredient: string | null
          approved: boolean | null
          category: string
          created_at: string
          description: string | null
          dosage: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          manufacturer: string
          name: string
          price: number | null
          updated_at: string
          uses: string | null
        }
        Insert: {
          active_ingredient?: string | null
          approved?: boolean | null
          category: string
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer: string
          name: string
          price?: number | null
          updated_at?: string
          uses?: string | null
        }
        Update: {
          active_ingredient?: string | null
          approved?: boolean | null
          category?: string
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer?: string
          name?: string
          price?: number | null
          updated_at?: string
          uses?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_daily_updates: boolean | null
          email_price_alerts: boolean | null
          email_trade_alerts: boolean | null
          id: string
          push_daily_updates: boolean | null
          push_price_alerts: boolean | null
          push_trade_alerts: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_daily_updates?: boolean | null
          email_price_alerts?: boolean | null
          email_trade_alerts?: boolean | null
          id?: string
          push_daily_updates?: boolean | null
          push_price_alerts?: boolean | null
          push_trade_alerts?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_daily_updates?: boolean | null
          email_price_alerts?: boolean | null
          email_trade_alerts?: boolean | null
          id?: string
          push_daily_updates?: boolean | null
          push_price_alerts?: boolean | null
          push_trade_alerts?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          notes: string | null
          phone: string | null
          shipping_address: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          notes?: string | null
          phone?: string | null
          shipping_address?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          phone?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      powermon_devices: {
        Row: {
          capacity: number
          created_at: string
          current_amps: number | null
          device_id: string
          id: string
          location: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          current_amps?: number | null
          device_id: string
          id?: string
          location: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_amps?: number | null
          device_id?: string
          id?: string
          location?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          discount_price: number | null
          id: string
          image_urls: string[] | null
          in_stock: boolean | null
          name: string
          price: number
          specifications: Json | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          image_urls?: string[] | null
          in_stock?: boolean | null
          name: string
          price: number
          specifications?: Json | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          image_urls?: string[] | null
          in_stock?: boolean | null
          name?: string
          price?: number
          specifications?: Json | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_handshakes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_handshakes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_saves: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_saves_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          order_id: string
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          order_id: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sell_crop_requests: {
        Row: {
          address: string
          admin_notes: string | null
          count: number
          created_at: string
          crop_type: string
          district: string
          expected_price_per_kg: number | null
          id: string
          phone_number: string | null
          pickup_date: string
          preferred_contact_time: string | null
          quantity_tons: number
          state: string
          status: string
          total_value_estimate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          admin_notes?: string | null
          count: number
          created_at?: string
          crop_type: string
          district: string
          expected_price_per_kg?: number | null
          id?: string
          phone_number?: string | null
          pickup_date: string
          preferred_contact_time?: string | null
          quantity_tons: number
          state: string
          status?: string
          total_value_estimate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          admin_notes?: string | null
          count?: number
          created_at?: string
          crop_type?: string
          district?: string
          expected_price_per_kg?: number | null
          id?: string
          phone_number?: string | null
          pickup_date?: string
          preferred_contact_time?: string | null
          quantity_tons?: number
          state?: string
          status?: string
          total_value_estimate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          created_at: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shrimp_rates: {
        Row: {
          count_range: string
          created_at: string
          date: string
          id: string
          location: string
          rate_per_kg: number
          updated_at: string
        }
        Insert: {
          count_range: string
          created_at?: string
          date?: string
          id?: string
          location?: string
          rate_per_kg: number
          updated_at?: string
        }
        Update: {
          count_range?: string
          created_at?: string
          date?: string
          id?: string
          location?: string
          rate_per_kg?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
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
      app_role: "admin" | "moderator" | "user"
      content_category: "disease" | "magazine" | "crop_manual" | "product"
      disease_category: "shrimp" | "fish"
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
      content_category: ["disease", "magazine", "crop_manual", "product"],
      disease_category: ["shrimp", "fish"],
    },
  },
} as const
