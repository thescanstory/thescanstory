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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          cached_confirmed: boolean
          cached_confirmed_at: string | null
          id: string
          mind_target_path: string | null
          order_id: string | null
          session_id: string | null
          storage_bucket: string
          storage_path: string
          storage_purged: boolean
          type: Database["public"]["Enums"]["media_type"]
          uploaded_at: string
        }
        Insert: {
          cached_confirmed?: boolean
          cached_confirmed_at?: string | null
          id?: string
          mind_target_path?: string | null
          order_id?: string | null
          session_id?: string | null
          storage_bucket: string
          storage_path: string
          storage_purged?: boolean
          type: Database["public"]["Enums"]["media_type"]
          uploaded_at?: string
        }
        Update: {
          cached_confirmed?: boolean
          cached_confirmed_at?: string | null
          id?: string
          mind_target_path?: string | null
          order_id?: string | null
          session_id?: string | null
          storage_bucket?: string
          storage_path?: string
          storage_purged?: boolean
          type?: Database["public"]["Enums"]["media_type"]
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          session_id: string | null
          text_content: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          session_id?: string | null
          text_content: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          session_id?: string | null
          text_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cod_handling_fee_paise: number
          cod_verified: boolean
          created_at: string
          customer_id: string | null
          email: string
          experience_slug: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method_t"]
          payment_status: Database["public"]["Enums"]["payment_status_t"]
          phone: string
          product_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          session_id: string | null
          shipping_address: Json
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          cod_handling_fee_paise?: number
          cod_verified?: boolean
          created_at?: string
          customer_id?: string | null
          email: string
          experience_slug: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method_t"]
          payment_status?: Database["public"]["Enums"]["payment_status_t"]
          phone: string
          product_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          session_id?: string | null
          shipping_address: Json
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          cod_handling_fee_paise?: number
          cod_verified?: boolean
          created_at?: string
          customer_id?: string | null
          email?: string
          experience_slug?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method_t"]
          payment_status?: Database["public"]["Enums"]["payment_status_t"]
          phone?: string
          product_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          session_id?: string | null
          shipping_address?: Json
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          session_id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          session_id: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          session_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "otp_codes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_paise: number
          type: Database["public"]["Enums"]["product_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_paise: number
          type: Database["public"]["Enums"]["product_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_paise?: number
          type?: Database["public"]["Enums"]["product_type"]
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      media_type: "target_photo" | "video"
      order_status: "pending" | "paid" | "cod_pending" | "shipped" | "delivered"
      payment_method_t: "online" | "cod"
      payment_status_t: "unpaid" | "paid" | "failed" | "refunded"
      product_type: "frame" | "wallet_card" | "tshirt"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      media_type: ["target_photo", "video"],
      order_status: ["pending", "paid", "cod_pending", "shipped", "delivered"],
      payment_method_t: ["online", "cod"],
      payment_status_t: ["unpaid", "paid", "failed", "refunded"],
      product_type: ["frame", "wallet_card", "tshirt"],
    },
  },
} as const

export type ProductType = Database["public"]["Enums"]["product_type"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method_t"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status_t"];
export type MediaType = Database["public"]["Enums"]["media_type"];
