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
      admin_notifications: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          notification_type: string
          picter_link: string | null
          project_id: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          notification_type: string
          picter_link?: string | null
          project_id: string
          title: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          notification_type?: string
          picter_link?: string | null
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_templates: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          deliverables: number
          description: string | null
          estimated_hours: number | null
          id: string
          project_value: number | null
          template_name: string
          updated_at: string
          work_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          deliverables?: number
          description?: string | null
          estimated_hours?: number | null
          id?: string
          project_value?: number | null
          template_name: string
          updated_at?: string
          work_type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          deliverables?: number
          description?: string | null
          estimated_hours?: number | null
          id?: string
          project_value?: number | null
          template_name?: string
          updated_at?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          is_general: boolean
          name: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          is_general?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          is_general?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_chase_alerts: {
        Row: {
          chase_count: number
          chase_up_due_at: string
          created_at: string
          dismissed_at: string | null
          dismissed_by: string | null
          email_sent_at: string
          id: string
          is_dismissed: boolean
          last_chase_at: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          chase_count?: number
          chase_up_due_at: string
          created_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          email_sent_at?: string
          id?: string
          is_dismissed?: boolean
          last_chase_at?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          chase_count?: number
          chase_up_due_at?: string
          created_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          email_sent_at?: string
          id?: string
          is_dismissed?: boolean
          last_chase_at?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_chase_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          client_id: string
          created_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
          retainer_end_date: string | null
          retainer_hours_per_month: number | null
          retainer_start_date: string | null
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
          retainer_end_date?: string | null
          retainer_hours_per_month?: number | null
          retainer_start_date?: string | null
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
          retainer_end_date?: string | null
          retainer_hours_per_month?: number | null
          retainer_start_date?: string | null
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
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          project_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          project_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      message_mentions: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          mentioned_staff_email: string
          mentioned_staff_name: string
          message_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          mentioned_staff_email: string
          mentioned_staff_name: string
          message_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          mentioned_staff_email?: string
          mentioned_staff_name?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          user_email: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_email?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_email?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean
          message_type: string
          reactions: Json | null
          sender_email: string | null
          sender_name: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          reactions?: Json | null
          sender_email?: string | null
          sender_name: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          reactions?: Json | null
          sender_email?: string | null
          sender_name?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      project_bookings: {
        Row: {
          booking_date: string
          created_at: string
          end_time: string
          hours_booked: number
          id: string
          notes: string | null
          project_id: string
          staff_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          end_time: string
          hours_booked: number
          id?: string
          notes?: string | null
          project_id: string
          staff_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          end_time?: string
          hours_booked?: number
          id?: string
          notes?: string | null
          project_id?: string
          staff_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      project_closure_checklist: {
        Row: {
          completed_at: string | null
          created_at: string
          drive_link: string | null
          final_version_uploaded: boolean | null
          id: string
          project_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          drive_link?: string | null
          final_version_uploaded?: boolean | null
          id?: string
          project_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          drive_link?: string | null
          final_version_uploaded?: boolean | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_closure_checklist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      project_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          picter_link: string | null
          project_id: string
          stage_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          picter_link?: string | null
          project_id: string
          stage_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          picter_link?: string | null
          project_id?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_status_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_staff_id: string | null
          client_estimated_days: number | null
          client_estimated_hours: number | null
          client_id: string
          contract_signed: boolean | null
          created_at: string
          current_stage: string | null
          deliverables: number | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          google_review_link: string | null
          id: string
          internal_review_completed: boolean | null
          is_retainer: boolean | null
          picter_link: string | null
          po_number: string | null
          po_required: boolean | null
          project_value: number | null
          stage_status: string | null
          status: string | null
          title: string
          treat_as_oneoff: boolean | null
          updated_at: string
          work_type: string
        }
        Insert: {
          assigned_staff_id?: string | null
          client_estimated_days?: number | null
          client_estimated_hours?: number | null
          client_id: string
          contract_signed?: boolean | null
          created_at?: string
          current_stage?: string | null
          deliverables?: number | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          google_review_link?: string | null
          id?: string
          internal_review_completed?: boolean | null
          is_retainer?: boolean | null
          picter_link?: string | null
          po_number?: string | null
          po_required?: boolean | null
          project_value?: number | null
          stage_status?: string | null
          status?: string | null
          title: string
          treat_as_oneoff?: boolean | null
          updated_at?: string
          work_type: string
        }
        Update: {
          assigned_staff_id?: string | null
          client_estimated_days?: number | null
          client_estimated_hours?: number | null
          client_id?: string
          contract_signed?: boolean | null
          created_at?: string
          current_stage?: string | null
          deliverables?: number | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          google_review_link?: string | null
          id?: string
          internal_review_completed?: boolean | null
          is_retainer?: boolean | null
          picter_link?: string | null
          po_number?: string | null
          po_required?: boolean | null
          project_value?: number | null
          stage_status?: string | null
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
          email: string
          id: string
          invitation_status: string | null
          is_active: boolean | null
          name: string
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["staff_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invitation_status?: string | null
          is_active?: boolean | null
          name: string
          profile_picture_url?: string | null
          role: Database["public"]["Enums"]["staff_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invitation_status?: string | null
          is_active?: boolean | null
          name?: string
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
        }
        Relationships: []
      }
      staff_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          staff_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          staff_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          staff_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          staff_id: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: string
          staff_id?: string | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          staff_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_off: {
        Row: {
          created_at: string
          end_date: string
          end_time: string | null
          id: string
          is_full_day: boolean
          notes: string | null
          reason: string
          staff_id: string
          start_date: string
          start_time: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          end_time?: string | null
          id?: string
          is_full_day?: boolean
          notes?: string | null
          reason: string
          staff_id: string
          start_date: string
          start_time?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          end_time?: string | null
          id?: string
          is_full_day?: boolean
          notes?: string | null
          reason?: string
          staff_id?: string
          start_date?: string
          start_time?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_calendar_entries: {
        Row: {
          id: string
          staff_id: string
          title: string
          description: string | null
          entry_date: string
          start_time: string
          end_time: string
          entry_type: string
          meeting_link: string | null
          location: string | null
          is_all_day: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          title: string
          description?: string | null
          entry_date: string
          start_time: string
          end_time: string
          entry_type?: string
          meeting_link?: string | null
          location?: string | null
          is_all_day?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          title?: string
          description?: string | null
          entry_date?: string
          start_time?: string
          end_time?: string
          entry_type?: string
          meeting_link?: string | null
          location?: string | null
          is_all_day?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_calendar_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_invitation_token: {
        Args: { token_param: string }
        Returns: {
          id: string
          email: string
          staff_id: string
          token: string
          expires_at: string
          accepted_at: string
          created_at: string
          created_by: string
          name: string
          role: string
          profile_picture_url: string
          invitation_status: string
        }[]
      }
    }
    Enums: {
      staff_role: "Admin" | "Staff"
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
      staff_role: ["Admin", "Staff"],
    },
  },
} as const
