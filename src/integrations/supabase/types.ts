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
      businesses: {
        Row: {
          address: string | null
          created_at: string
          id: string
          logo_url: string | null
          owner_id: string
          owner_name: string
          phone: string | null
          shop_name: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          owner_id: string
          owner_name: string
          phone?: string | null
          shop_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          owner_id?: string
          owner_name?: string
          phone?: string | null
          shop_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          id: string
          business_id: string
          code: string
          name: string
          type: string
          parent_id: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          code: string
          name: string
          type: string
          parent_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          code?: string
          name?: string
          type?: string
          parent_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          alt_phone: string | null
          business_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          reference: string | null
          reference_phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          business_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          reference?: string | null
          reference_phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          reference?: string | null
          reference_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          role: string | null
          salary: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          role?: string | null
          salary?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          salary?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
        }
        Insert: {
          amount?: number
          business_id: string
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      gold_rates: {
        Row: {
          business_id: string
          created_at: string
          id: string
          notes: string | null
          rate_date: string
          silver_tola: number
          tola_18k: number
          tola_21k: number
          tola_22k: number
          tola_24k: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          notes?: string | null
          rate_date?: string
          silver_tola?: number
          tola_18k?: number
          tola_21k?: number
          tola_22k?: number
          tola_24k?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          rate_date?: string
          silver_tola?: number
          tola_18k?: number
          tola_21k?: number
          tola_22k?: number
          tola_24k?: number
          updated_at?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          balance: number
          business_id: string
          created_at: string
          credit: number
          date: string
          debit: number
          description: string | null
          entry_type: string
          id: string
          reference_id: string
        }
        Insert: {
          balance?: number
          business_id: string
          created_at?: string
          credit?: number
          date?: string
          debit?: number
          description?: string | null
          entry_type: string
          id?: string
          reference_id: string
        }
        Update: {
          balance?: number
          business_id?: string
          created_at?: string
          credit?: number
          date?: string
          debit?: number
          description?: string | null
          entry_type?: string
          id?: string
          reference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          description: string | null
          id: string
          payment_method: string | null
          received_by: string | null
          reference_id: string | null
          sale_id: string | null
          type: string
          custom_order_id: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          received_by?: string | null
          reference_id?: string | null
          sale_id?: string | null
          type: string
          custom_order_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          received_by?: string | null
          reference_id?: string | null
          sale_id?: string | null
          type?: string
          custom_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category_id: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          stock_quantity: number
          updated_at: string
          weight_unit: string | null
          weight_value: number | null
          purity_karat: number | null
          gross_weight: number | null
          net_weight: number | null
          serial_number: string | null
        }
        Insert: {
          business_id: string
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          stock_quantity?: number
          updated_at?: string
          weight_unit?: string | null
          weight_value?: number | null
          purity_karat?: number | null
          gross_weight?: number | null
          net_weight?: number | null
          serial_number?: string | null
        }
        Update: {
          business_id?: string
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          stock_quantity?: number
          updated_at?: string
          weight_unit?: string | null
          weight_value?: number | null
          purity_karat?: number | null
          gross_weight?: number | null
          net_weight?: number | null
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          id: string
          product_id: string | null
          product_name: string
          purchase_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          product_id?: string | null
          product_name: string
          purchase_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          id?: string
          product_id?: string | null
          product_name?: string
          purchase_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_sales: {
        Row: {
          id: string
          business_id: string
          purchase_id: string
          sold_price: number
          sold_to: string
          customer_id: string | null
          vendor_name: string | null
          notes: string | null
          profit: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          purchase_id: string
          sold_price?: number
          sold_to?: string
          customer_id?: string | null
          vendor_name?: string | null
          notes?: string | null
          profit?: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          purchase_id?: string
          sold_price?: number
          sold_to?: string
          customer_id?: string | null
          vendor_name?: string | null
          notes?: string | null
          profit?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_sales_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          id: string
          invoice_number: string | null
          paid_amount: number
          payment_status: string
          source_type: string
          add_to_stock: boolean
          supplier_id: string | null
          total_amount: number
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          paid_amount?: number
          payment_status?: string
          source_type?: string
          add_to_stock?: boolean
          supplier_id?: string | null
          total_amount?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          paid_amount?: number
          payment_status?: string
          source_type?: string
          add_to_stock?: boolean
          supplier_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          employee_id: string
          id: string
          month: string
          paid_at: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          employee_id: string
          id?: string
          month: string
          paid_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          month?: string
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salaries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          polish_waste: number
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
          weight: number
          weight_unit: string
          purity_karat: number | null
          gross_weight: number
          net_weight: number
        }
        Insert: {
          id?: string
          polish_waste?: number
          product_id?: string | null
          product_name: string
          quantity?: number
          sale_id: string
          total?: number
          unit_price?: number
          weight?: number
          weight_unit?: string
          purity_karat?: number | null
          gross_weight?: number
          net_weight?: number
        }
        Update: {
          id?: string
          polish_waste?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
          weight?: number
          weight_unit?: string
          purity_karat?: number | null
          gross_weight?: number
          net_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          discount: number
          final_amount: number
          id: string
          invoice_number: string | null
          paid_amount: number
          payment_status: string
          repayment_date: string | null
          tola_rate: number
          total_amount: number
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          final_amount?: number
          id?: string
          invoice_number?: string | null
          paid_amount?: number
          payment_status?: string
          repayment_date?: string | null
          tola_rate?: number
          total_amount?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          final_amount?: number
          id?: string
          invoice_number?: string | null
          paid_amount?: number
          payment_status?: string
          repayment_date?: string | null
          tola_rate?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          alt_phone: string | null
          business_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          business_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      karigars: {
        Row: {
          id: string
          business_id: string
          name: string
          phone: string | null
          address: string | null
          specialty: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          phone?: string | null
          address?: string | null
          specialty?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          phone?: string | null
          address?: string | null
          specialty?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "karigars_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cards: {
        Row: {
          id: string
          business_id: string
          job_number: string
          karigar_id: string | null
          customer_id: string | null
          description: string
          gold_given: number
          gold_given_unit: string
          gold_returned: number | null
          gold_returned_unit: string | null
          making_charges: number | null
          service_type: string
          service_charge: number
          advance_amount: number
          item_photo_url: string | null
          customer_phone_snapshot: string | null
          status: string
          given_date: string | null
          expected_date: string | null
          returned_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          job_number: string
          karigar_id?: string | null
          customer_id?: string | null
          description: string
          gold_given: number
          gold_given_unit: string
          gold_returned?: number | null
          gold_returned_unit?: string | null
          making_charges?: number | null
          service_type: string
          service_charge: number
          advance_amount: number
          item_photo_url?: string | null
          customer_phone_snapshot?: string | null
          status: string
          given_date?: string | null
          expected_date?: string | null
          returned_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          job_number?: string
          karigar_id?: string | null
          customer_id?: string | null
          description?: string
          gold_given?: number
          gold_given_unit?: string
          gold_returned?: number | null
          gold_returned_unit?: string | null
          making_charges?: number | null
          service_type?: string
          service_charge?: number
          advance_amount?: number
          item_photo_url?: string | null
          customer_phone_snapshot?: string | null
          status?: string
          given_date?: string | null
          expected_date?: string | null
          returned_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_karigar_id_fkey"
            columns: ["karigar_id"]
            isOneToOne: false
            referencedRelation: "karigars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_orders: {
        Row: {
          id: string
          business_id: string
          order_number: string
          customer_id: string | null
          karigar_id: string | null
          description: string
          design_reference_url: string | null
          estimated_weight: number | null
          weight_unit: string
          purity_karat: number | null
          total_price: number
          advance_amount: number
          paid_amount: number
          status: string
          order_date: string
          expected_delivery_date: string | null
          delivered_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          order_number: string
          customer_id?: string | null
          karigar_id?: string | null
          description: string
          design_reference_url?: string | null
          estimated_weight?: number | null
          weight_unit: string
          purity_karat?: number | null
          total_price: number
          advance_amount: number
          paid_amount: number
          status: string
          order_date: string
          expected_delivery_date?: string | null
          delivered_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          order_number?: string
          customer_id?: string | null
          karigar_id?: string | null
          description?: string
          design_reference_url?: string | null
          estimated_weight?: number | null
          weight_unit?: string
          purity_karat?: number | null
          total_price?: number
          advance_amount?: number
          paid_amount?: number
          status?: string
          order_date?: string
          expected_delivery_date?: string | null
          delivered_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_orders_karigar_id_fkey"
            columns: ["karigar_id"]
            isOneToOne: false
            referencedRelation: "karigars"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          business_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "business_admin" | "staff"
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
      app_role: ["super_admin", "business_admin", "staff"],
    },
  },
} as const
