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
      clients: {
        Row: {
          address: string | null
          company: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          is_retainer: boolean | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_retainer?: boolean | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_retainer?: boolean | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      crm_billing_records: {
        Row: {
          amount: number | null
          billing_percentage: number
          created_at: string
          id: string
          invoice_number: string | null
          invoice_status: string | null
          processed_at: string | null
          project_id: string
          stage_id: string
        }
        Insert: {
          amount?: number | null
          billing_percentage: number
          created_at?: string
          id?: string
          invoice_number?: string | null
          invoice_status?: string | null
          processed_at?: string | null
          project_id: string
          stage_id: string
        }
        Update: {
          amount?: number | null
          billing_percentage?: number
          created_at?: string
          id?: string
          invoice_number?: string | null
          invoice_status?: string | null
          processed_at?: string | null
          project_id?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_billing_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_billing_records_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_stage: string | null
          id: string
          notes: string | null
          project_id: string
          to_stage: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          project_id: string
          to_stage: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stage_history_from_stage_fkey"
            columns: ["from_stage"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stage_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stage_history_to_stage_fkey"
            columns: ["to_stage"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          billing_percentage: number | null
          description: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          billing_percentage?: number | null
          description?: string | null
          id: string
          name: string
          order_index: number
        }
        Update: {
          billing_percentage?: number | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_staff_id: string | null
          client_id: string
          created_at: string
          current_stage: string | null
          deliverables: number | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_retainer: boolean | null
          po_number: string | null
          project_value: number | null
          status: string | null
          title: string
          treat_as_oneoff: boolean | null
          updated_at: string
          work_type: string
        }
        Insert: {
          assigned_staff_id?: string | null
          client_id: string
          created_at?: string
          current_stage?: string | null
          deliverables?: number | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_retainer?: boolean | null
          po_number?: string | null
          project_value?: number | null
          status?: string | null
          title: string
          treat_as_oneoff?: boolean | null
          updated_at?: string
          work_type: string
        }
        Update: {
          assigned_staff_id?: string | null
          client_id?: string
          created_at?: string
          current_stage?: string | null
          deliverables?: number | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_retainer?: boolean | null
          po_number?: string | null
          project_value?: number | null
          status?: string | null
          title?: string
          treat_as_oneoff?: boolean | null
          updated_at?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_current_stage_fkey"
            columns: ["current_stage"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          department: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          role: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string
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
