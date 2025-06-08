
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Staff } from '@/types/staff';

interface StaffContextProps {
  staff: Staff[];
  loading: boolean;
  currentStaff: Staff | null;
  allStaff: Staff[];
  setCurrentStaff: (staff: Staff | null) => void;
  loadStaff: () => Promise<void>;
}

const StaffContext = createContext<StaffContextProps | undefined>(undefined);

export const StaffProvider = ({ children }: { children: React.ReactNode }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      const staffData = (data || []) as Staff[];
      setStaff(staffData);
      
      // Set the first staff member as current if none is selected
      if (!currentStaff && staffData.length > 0) {
        setCurrentStaff(staffData[0]);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const value: StaffContextProps = { 
    staff, 
    loading, 
    currentStaff,
    allStaff: staff,
    setCurrentStaff,
    loadStaff 
  };

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};
