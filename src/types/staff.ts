
export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  department?: string;
  profile_picture_url?: string | null;
  invitation_status?: 'pending' | 'invited' | 'accepted';
  is_active?: boolean;
  created_at?: string;
}
