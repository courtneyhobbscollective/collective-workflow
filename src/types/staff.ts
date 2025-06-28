export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  department: string; // Make this required with default value
  profile_picture_url?: string | null;
  invitation_status?: 'pending' | 'invited' | 'accepted' | null;
  is_active?: boolean | null;
  available_hours_per_week?: number | null;
  created_at?: string;
}

export interface PersonalCalendarEntry {
  id: string;
  staff_id: string;
  title: string;
  description: string | null;
  entry_date: string;
  start_time: string;
  end_time: string;
  entry_type: 'meeting' | 'client_call' | 'personal' | 'other';
  meeting_link: string | null;
  location: string | null;
  is_all_day: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  created_at: string;
  updated_at: string;
}
