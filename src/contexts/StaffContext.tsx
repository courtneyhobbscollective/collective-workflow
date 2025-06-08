
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Staff } from '@/types/staff';

interface StaffContextType {
  currentStaff: Staff | null;
  setCurrentStaff: (staff: Staff | null) => void;
  allStaff: Staff[];
  loadStaff: () => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const { staff: authStaff } = useAuth();

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAllStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Reload staff to reflect changes
      await loadStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  };

  // Sync current staff with auth staff
  useEffect(() => {
    if (authStaff) {
      setCurrentStaff(authStaff);
    } else {
      setCurrentStaff(null);
    }
  }, [authStaff]);

  useEffect(() => {
    loadStaff();
  }, []);

  return (
    <StaffContext.Provider value={{
      currentStaff,
      setCurrentStaff,
      allStaff,
      loadStaff,
      updateStaff
    }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}
