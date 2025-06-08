
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  profile_picture_url: string | null;
}

interface StaffContextType {
  currentStaff: Staff | null;
  setCurrentStaff: (staff: Staff | null) => void;
  allStaff: Staff[];
  loadStaff: () => Promise<void>;
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
      
      // Set first staff member as current if none selected
      if (!currentStaff && data && data.length > 0) {
        setCurrentStaff(data[0]);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
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
      loadStaff
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
