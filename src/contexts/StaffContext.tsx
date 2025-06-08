
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  profile_picture_url: string | null;
}

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

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAllStaff(data || []);
      
      // Auto-set first staff member as current (simulating logged in user)
      if (!currentStaff && data && data.length > 0) {
        setCurrentStaff(data[0]);
      }
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
