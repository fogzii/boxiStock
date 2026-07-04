export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      Bundle: {
        Row: {
          createdAt: string;
          dateSold: string | null;
          id: string;
          name: string;
          totalBuyCost: number;
          totalProfit: number;
          totalSellPrice: number;
          userId: string;
        };
        Insert: {
          createdAt?: string;
          dateSold?: string | null;
          id?: string;
          name: string;
          totalBuyCost: number;
          totalProfit: number;
          totalSellPrice: number;
          userId: string;
        };
        Update: {
          createdAt?: string;
          dateSold?: string | null;
          id?: string;
          name?: string;
          totalBuyCost?: number;
          totalProfit?: number;
          totalSellPrice?: number;
          userId?: string;
        };
        Relationships: [];
      };
      BundleItem: {
        Row: {
          bundleId: string;
          buyPricePerUnit: number;
          createdAt: string;
          id: string;
          lotId: string | null;
          productId: string | null;
          productName: string;
          quantityConsumed: number;
          totalBuyCost: number;
        };
        Insert: {
          bundleId: string;
          buyPricePerUnit: number;
          createdAt?: string;
          id?: string;
          lotId?: string | null;
          productId?: string | null;
          productName: string;
          quantityConsumed: number;
          totalBuyCost: number;
        };
        Update: {
          bundleId?: string;
          buyPricePerUnit?: number;
          createdAt?: string;
          id?: string;
          lotId?: string | null;
          productId?: string | null;
          productName?: string;
          quantityConsumed?: number;
          totalBuyCost?: number;
        };
        Relationships: [
          {
            foreignKeyName: "BundleItem_bundleId_fkey";
            columns: ["bundleId"];
            isOneToOne: false;
            referencedRelation: "Bundle";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "BundleItem_lotId_fkey";
            columns: ["lotId"];
            isOneToOne: false;
            referencedRelation: "StockLot";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "BundleItem_productId_fkey";
            columns: ["productId"];
            isOneToOne: false;
            referencedRelation: "Product";
            referencedColumns: ["id"];
          },
        ];
      };
      Product: {
        Row: {
          createdAt: string;
          id: string;
          lastSoldAt: string | null;
          name: string;
          saleCount: number;
          totalProfit: number;
          totalRevenue: number;
          totalUnitsSold: number;
          updatedAt: string;
          userId: string;
        };
        Insert: {
          createdAt?: string;
          id?: string;
          lastSoldAt?: string | null;
          name: string;
          saleCount?: number;
          totalProfit?: number;
          totalRevenue?: number;
          totalUnitsSold?: number;
          updatedAt?: string;
          userId: string;
        };
        Update: {
          createdAt?: string;
          id?: string;
          lastSoldAt?: string | null;
          name?: string;
          saleCount?: number;
          totalProfit?: number;
          totalRevenue?: number;
          totalUnitsSold?: number;
          updatedAt?: string;
          userId?: string;
        };
        Relationships: [];
      };
      Sale: {
        Row: {
          createdAt: string;
          dateSold: string;
          id: string;
          notes: string | null;
          productId: string;
          quantitySold: number;
          totalProfit: number;
          totalSalePrice: number;
        };
        Insert: {
          createdAt?: string;
          dateSold?: string;
          id?: string;
          notes?: string | null;
          productId: string;
          quantitySold: number;
          totalProfit: number;
          totalSalePrice: number;
        };
        Update: {
          createdAt?: string;
          dateSold?: string;
          id?: string;
          notes?: string | null;
          productId?: string;
          quantitySold?: number;
          totalProfit?: number;
          totalSalePrice?: number;
        };
        Relationships: [
          {
            foreignKeyName: "Sale_productId_fkey";
            columns: ["productId"];
            isOneToOne: false;
            referencedRelation: "Product";
            referencedColumns: ["id"];
          },
        ];
      };
      ShareInvite: {
        Row: {
          createdAt: string;
          id: string;
          inviteeEmail: string;
          inviteeId: string;
          ownerId: string;
          respondedAt: string | null;
          sections: string[];
          showStockAmounts: boolean;
          status: string;
        };
        Insert: {
          createdAt?: string;
          id?: string;
          inviteeEmail: string;
          inviteeId: string;
          ownerId: string;
          respondedAt?: string | null;
          sections?: string[];
          showStockAmounts?: boolean;
          status?: string;
        };
        Update: {
          createdAt?: string;
          id?: string;
          inviteeEmail?: string;
          inviteeId?: string;
          ownerId?: string;
          respondedAt?: string | null;
          sections?: string[];
          showStockAmounts?: boolean;
          status?: string;
        };
        Relationships: [];
      };
      ShareLink: {
        Row: {
          createdAt: string;
          expiresAt: string | null;
          id: string;
          isActive: boolean;
          label: string | null;
          passwordHash: string | null;
          sections: string[];
          showStockAmounts: boolean;
          token: string;
          userId: string;
          visibility: string;
        };
        Insert: {
          createdAt?: string;
          expiresAt?: string | null;
          id?: string;
          isActive?: boolean;
          label?: string | null;
          passwordHash?: string | null;
          sections: string[];
          showStockAmounts?: boolean;
          token: string;
          userId: string;
          visibility?: string;
        };
        Update: {
          createdAt?: string;
          expiresAt?: string | null;
          id?: string;
          isActive?: boolean;
          label?: string | null;
          passwordHash?: string | null;
          sections?: string[];
          showStockAmounts?: boolean;
          token?: string;
          userId?: string;
          visibility?: string;
        };
        Relationships: [];
      };
      StockLot: {
        Row: {
          buyPrice: number;
          createdAt: string;
          dateAcquired: string;
          id: string;
          initialQuantity: number;
          isStocked: boolean;
          lotIdentity: string | null;
          notes: string | null;
          productId: string;
          remainingQuantity: number;
          updatedAt: string;
        };
        Insert: {
          buyPrice: number;
          createdAt?: string;
          dateAcquired?: string;
          id?: string;
          initialQuantity: number;
          isStocked?: boolean;
          lotIdentity?: string | null;
          notes?: string | null;
          productId: string;
          remainingQuantity: number;
          updatedAt?: string;
        };
        Update: {
          buyPrice?: number;
          createdAt?: string;
          dateAcquired?: string;
          id?: string;
          initialQuantity?: number;
          isStocked?: boolean;
          lotIdentity?: string | null;
          notes?: string | null;
          productId?: string;
          remainingQuantity?: number;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "StockLot_productId_fkey";
            columns: ["productId"];
            isOneToOne: false;
            referencedRelation: "Product";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      find_user_id_by_email: { Args: { p_email: string }; Returns: string };
      get_combined_sales_paginated: {
        Args: {
          p_page?: number;
          p_page_size?: number;
          p_search?: string;
          p_sort?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_dashboard_metrics: { Args: { p_user_id: string }; Returns: Json };
      get_inventory_paginated: {
        Args: {
          p_page?: number;
          p_page_size?: number;
          p_search?: string;
          p_sort?: string;
          p_status?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_inventory_value_by_status: {
        Args: { p_status?: string; p_user_id: string };
        Returns: number;
      };
      get_sales_by_month: {
        Args: { p_user_id: string };
        Returns: {
          month: number;
          total_profit: number;
          year: number;
        }[];
      };
      sync_product_sale_stats: {
        Args: { p_product_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
