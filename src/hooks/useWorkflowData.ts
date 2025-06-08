import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Staff } from '@/types/staff';

interface Client {
  id: string;
  company: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string;
  estimated_hours: number;
  status: 'active' | 'pending' | 'completed' | 'on_hold' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  client: Client;
  assigned_staff_id: string | null;
  assigned_staff: Staff | null;
}

export function useWorkflowData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, staffResponse] = await Promise.all([
        supabase
          .from('projects')
          .select(`
            *,
            client:clients(*),
            assigned_staff:staff(*)
          `)
          .order('updated_at', { ascending: false }),
        supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      if (projectsResponse.error) throw projectsResponse.error;
      if (staffResponse.error) throw staffResponse.error;

      setProjects((projectsResponse.data || []) as Project[]);
      setStaff((staffResponse.data || []) as Staff[]);
    } catch (err) {
      console.error('Error loading workflow data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    projects,
    staff,
    loading,
    error,
    reload: loadData
  };
}
