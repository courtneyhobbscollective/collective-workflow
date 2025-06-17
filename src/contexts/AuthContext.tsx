import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Staff } from '@/types/staff';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  staff: Staff | null;
  clientProfile: { client_id: string; client: { company: string; name: string; is_retainer: boolean; } } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [clientProfile, setClientProfile] = useState<{ client_id: string; client: { company: string; name: string; is_retainer: boolean; } } | null>(null);
  const [loading, setLoading] = useState(true); // This should indicate if auth state AND profile are loaded
  const { toast } = useToast();

  const loadUserProfile = async (currentUser: User) => { // Pass user directly
    setStaff(null); // Reset before loading
    setClientProfile(null); // Reset before loading

    try {
      // Attempt to load staff profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          staff_id,
          staff:staff(*)
        `)
        .eq('id', currentUser.id) // Use currentUser.id
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error loading staff profile:', profileError);
      }

      if (profile?.staff) {
        setStaff(profile.staff as Staff);
        return; // Profile found, no need to check client
      }

      // If not staff, attempt to load client profile
      const { data: clientProfileData, error: clientProfileError } = await supabase
        .from('client_profiles')
        .select(`
          client_id,
          client:clients(company, name, is_retainer)
        `)
        .eq('user_id', currentUser.id) // Use currentUser.id
        .single();

      if (clientProfileError && clientProfileError.code !== 'PGRST116') {
        console.error('Error loading client profile:', clientProfileError);
      }
      setClientProfile(clientProfileData || null);

    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setStaff(null);
      setClientProfile(null);
    }
  };

  useEffect(() => {
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user); // Wait for profile to load
      } else {
        setStaff(null);
        setClientProfile(null);
      }
      setLoading(false); // Set loading to false only after everything is done
    };

    // Initial check for existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleAuthStateChange('INITIAL_LOAD', session); // Use the same handler
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array, runs once on mount.

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/setup-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error) {
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Please check your email for password reset instructions.",
      });
    }
    
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password
    });
    
    if (error) {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      setUser(null);
      setSession(null);
      setStaff(null);
      setClientProfile(null);
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      staff,
      clientProfile,
      loading, // This loading now correctly reflects profile loading too
      signIn,
      signOut,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}