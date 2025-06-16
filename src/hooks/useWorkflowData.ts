import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Staff } from '@/types/staff';

interface Client {
  id: string;
  company: string;
  name: string;
  contact_name: string;
  contact_email: string;
  is_retainer: boolean;
  created_at: string;
}

interface ProjectStage {
  id: string;
  name: string;
  order_index: number;
  billing_percentage: number;
  description: string;
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
  current_stage: string;
  work_type: string;
  deliverables: number;
  due_date: string;
  po_number: string;
  is_retainer: boolean;
  contract_signed: boolean;
  po_required: boolean;
  project_value: number | null;
  stage_status: string;
  picter_link: string | null;
  client: Client;
  assigned_staff_id: string | null;
  assigned_staff: Staff | null;
  internal_review_completed?: boolean; // Added this to match Project interface in ProjectCardMain
}

export function useWorkflowData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, staffResponse, stagesResponse] = await Promise.all([
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
          .order('name'),
        supabase
          .from('project_stages')
          .select('*')
          .order('order_index')
      ]);

      if (projectsResponse.error) throw projectsResponse.error;
      if (staffResponse.error) throw staffResponse.error;
      if (stagesResponse.error) throw stagesResponse.error;

      // Transform data to match interface
      const transformedProjects = (projectsResponse.data || []).map((project: any) => ({
        ...project,
        start_date: project.start_date || null,
        end_date: project.end_date || null,
        stage_status: project.stage_status || 'in_progress'
      }));

      const transformedStaff = (staffResponse.data || []).map((staff: any) => ({
        ...staff,
        invitation_status: staff.invitation_status as 'pending' | 'invited' | 'accepted'
      }));

      setProjects(transformedProjects);
      setStaff(transformedStaff);
      setStages(stagesResponse.data || []);
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
    setProjects, // Expose setProjects
    staff,
    stages,
    loading,
    error,
    loadData,
    reload: loadData
  };
}