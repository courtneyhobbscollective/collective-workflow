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
      channel_participants: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_participants_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          project_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          project_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_type: Database["public"]["Enums"]["client_type"] | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          profile_id: string | null
          retainer_hours: number | null
          retainer_value: number | null
        }
        Insert: {
          client_type?: Database["public"]["Enums"]["client_type"] | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          profile_id?: string | null
          retainer_hours?: number | null
          retainer_value?: number | null
        }
        Update: {
          client_type?: Database["public"]["Enums"]["client_type"] | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          profile_id?: string | null
          retainer_hours?: number | null
          retainer_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_channels: {
        Row: {
          auto_created: boolean | null
          channel_prefix: string | null
          channel_type: string
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          auto_created?: boolean | null
          channel_prefix?: string | null
          channel_type?: string
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          auto_created?: boolean | null
          channel_prefix?: string | null
          channel_type?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_channels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_comments: {
        Row: {
          comment_text: string
          created_at: string
          created_by: string
          id: string
          project_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          created_by: string
          id?: string
          project_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_project_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          is_edited: boolean | null
          message_type: string | null
          parent_message_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          project_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_status_labels: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          project_id: string | null
          stage: Database["public"]["Enums"]["project_stage"]
          status_label: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          stage: Database["public"]["Enums"]["project_stage"]
          status_label: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          status_label?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_status_labels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_completed: boolean | null
          project_id: string | null
          task_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_completed?: boolean | null
          project_id?: string | null
          task_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_completed?: boolean | null
          project_id?: string | null
          task_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_work_sessions: {
        Row: {
          created_at: string
          description: string | null
          end_datetime: string
          google_calendar_event_id: string | null
          id: string
          project_id: string | null
          session_type: Database["public"]["Enums"]["session_type"]
          staff_id: string
          start_datetime: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_datetime: string
          google_calendar_event_id?: string | null
          id?: string
          project_id?: string | null
          session_type?: Database["public"]["Enums"]["session_type"]
          staff_id: string
          start_datetime: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_datetime?: string
          google_calendar_event_id?: string | null
          id?: string
          project_id?: string | null
          session_type?: Database["public"]["Enums"]["session_type"]
          staff_id?: string
          start_datetime?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_work_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_work_sessions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          additional_comments: string | null
          archived_at: string | null
          archived_by: string | null
          assigned_staff_id: string | null
          billing_type:
            | Database["public"]["Enums"]["project_billing_type"]
            | null
          client_id: string
          client_name: string | null
          created_at: string | null
          crm_value: number | null
          deposit_invoice_raised: boolean | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          final_deliverables: string | null
          helpful_links: string | null
          id: string
          internal_review_url: string | null
          is_archived: boolean | null
          live_date: string | null
          location: string | null
          monday_added: boolean | null
          pending_internal_review: boolean | null
          po_number: string | null
          priority: Database["public"]["Enums"]["project_priority"] | null
          stage: Database["public"]["Enums"]["project_stage"] | null
          title: string
          updated_at: string | null
          urgency: number | null
          work_type: string | null
        }
        Insert: {
          additional_comments?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_staff_id?: string | null
          billing_type?:
            | Database["public"]["Enums"]["project_billing_type"]
            | null
          client_id: string
          client_name?: string | null
          created_at?: string | null
          crm_value?: number | null
          deposit_invoice_raised?: boolean | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          final_deliverables?: string | null
          helpful_links?: string | null
          id?: string
          internal_review_url?: string | null
          is_archived?: boolean | null
          live_date?: string | null
          location?: string | null
          monday_added?: boolean | null
          pending_internal_review?: boolean | null
          po_number?: string | null
          priority?: Database["public"]["Enums"]["project_priority"] | null
          stage?: Database["public"]["Enums"]["project_stage"] | null
          title: string
          updated_at?: string | null
          urgency?: number | null
          work_type?: string | null
        }
        Update: {
          additional_comments?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_staff_id?: string | null
          billing_type?:
            | Database["public"]["Enums"]["project_billing_type"]
            | null
          client_id?: string
          client_name?: string | null
          created_at?: string | null
          crm_value?: number | null
          deposit_invoice_raised?: boolean | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          final_deliverables?: string | null
          helpful_links?: string | null
          id?: string
          internal_review_url?: string | null
          is_archived?: boolean | null
          live_date?: string | null
          location?: string | null
          monday_added?: boolean | null
          pending_internal_review?: boolean | null
          po_number?: string | null
          priority?: Database["public"]["Enums"]["project_priority"] | null
          stage?: Database["public"]["Enums"]["project_stage"] | null
          title?: string
          updated_at?: string | null
          urgency?: number | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          hourly_rate: number | null
          id: string
          profile_id: string
          weekly_capacity_hours: number | null
        }
        Insert: {
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          profile_id: string
          weekly_capacity_hours?: number | null
        }
        Update: {
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          profile_id?: string
          weekly_capacity_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_working_hours: {
        Row: {
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          staff_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          end_time: string
          id?: string
          staff_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          end_time?: string
          id?: string
          staff_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_working_hours_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_gate_confirmations: {
        Row: {
          added_to_monday_crm: boolean | null
          confirmed_at: string | null
          confirmed_by: string | null
          deposit_invoice_raised: boolean | null
          from_stage: Database["public"]["Enums"]["project_stage"]
          id: string
          po_received: boolean | null
          project_id: string | null
          shoot_edit_dates_assigned: boolean | null
          to_stage: Database["public"]["Enums"]["project_stage"]
        }
        Insert: {
          added_to_monday_crm?: boolean | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          deposit_invoice_raised?: boolean | null
          from_stage: Database["public"]["Enums"]["project_stage"]
          id?: string
          po_received?: boolean | null
          project_id?: string | null
          shoot_edit_dates_assigned?: boolean | null
          to_stage: Database["public"]["Enums"]["project_stage"]
        }
        Update: {
          added_to_monday_crm?: boolean | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          deposit_invoice_raised?: boolean | null
          from_stage?: Database["public"]["Enums"]["project_stage"]
          id?: string
          po_received?: boolean | null
          project_id?: string | null
          shoot_edit_dates_assigned?: boolean | null
          to_stage?: Database["public"]["Enums"]["project_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "stage_gate_confirmations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_gate_confirmations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          hours: number
          id: string
          project_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          description?: string | null
          hours: number
          id?: string
          project_id: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          hours?: number
          id?: string
          project_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_logs: {
        Row: {
          created_at: string | null
          id: string
          log_message: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_message?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_message?: string | null
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          channel_id: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          id: string
          last_seen: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_access_channel: {
        Args: { user_id: string; channel_id: string }
        Returns: boolean
      }
      cleanup_old_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_my_claim: {
        Args: { claim: string }
        Returns: Json
      }
      user_can_access_channel_participants: {
        Args: { target_channel_id: string }
        Returns: boolean
      }
    }
    Enums: {
      client_type: "one_off" | "retainer"
      project_billing_type: "one_off" | "retainer"
      project_priority: "low" | "medium" | "high" | "urgent"
      project_stage:
        | "incoming_briefs"
        | "pre_production"
        | "production"
        | "amends_1"
        | "amends_2"
        | "final_client_submission"
        | "completed"
        | "stage_01_pre_production"
        | "stage_02_production"
        | "stage_03_amend_1"
        | "stage_04_amend_2"
        | "stage_05_final_delivery"
        | "stage_06_final_client_submission"
      session_type: "project_work" | "commitment"
      user_role: "admin" | "staff" | "client"
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
    Enums: {
      client_type: ["one_off", "retainer"],
      project_billing_type: ["one_off", "retainer"],
      project_priority: ["low", "medium", "high", "urgent"],
      project_stage: [
        "incoming_briefs",
        "pre_production",
        "production",
        "amends_1",
        "amends_2",
        "final_client_submission",
        "completed",
        "stage_01_pre_production",
        "stage_02_production",
        "stage_03_amend_1",
        "stage_04_amend_2",
        "stage_05_final_delivery",
        "stage_06_final_client_submission",
      ],
      session_type: ["project_work", "commitment"],
      user_role: ["admin", "staff", "client"],
    },
  },
} as const
