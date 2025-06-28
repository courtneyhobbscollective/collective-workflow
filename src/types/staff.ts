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
