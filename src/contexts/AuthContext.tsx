import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Staff } from '@/types/staff';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  staff: Staff | null;
  clientProfile: { client_id: string; client: { company: string; name: string; } } | null; // Added clientProfile
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [clientProfile, setClientProfile] = useState<{ client_id: string; client: { company: string; name: string; } } | null>(null); // Added clientProfile state
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUserProfile = async () => {
    if (!user) {
      setStaff(null);
      setClientProfile(null);
      return;
    }

    try {
      // Attempt to load staff profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          staff_id,
          staff:staff(*)
        `)
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error loading staff profile:', profileError);
        // Don't throw, try to load client profile next
      }

      if (profile?.staff) {
        setStaff(profile.staff as Staff);
        setClientProfile(null); // Ensure clientProfile is null if staff
      } else {
        setStaff(null); // Ensure staff is null if not found

        // If not staff, attempt to load client profile
        const { data: clientProfileData, error: clientProfileError } = await supabase
          .from('client_profiles')
          .select(`
            client_id,
            client:clients(company, name)
          `)
          .eq('user_id', user.id)
          .single();

        if (clientProfileError && clientProfileError.code !== 'PGRST116') {
          console.error('Error loading client profile:', clientProfileError);
        }
        setClientProfile(clientProfileData || null);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setStaff(null);
      setClientProfile(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Load user profile when logged in
        if (session?.user) {
          await loadUserProfile();
        } else {
          setStaff(null);
          setClientProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Re-load profile if user changes (e.g., after signup/login)
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

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
      setClientProfile(null); // Clear client profile on sign out
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
      clientProfile, // Provide clientProfile
      loading,
      signIn,
      signOut,
      loadUserProfile,
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