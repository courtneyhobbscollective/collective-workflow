
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUserProfile = async (currentUser: User) => {
    setStaff(null);
    setClientProfile(null);

    try {
      console.log('Loading user profile for:', currentUser.id);
      
      // Attempt to load staff profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          staff_id,
          staff:staff(*)
        `)
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading staff profile:', profileError);
      }

      if (profile?.staff) {
        console.log('Staff profile loaded:', profile.staff);
        setStaff(profile.staff as Staff);
        return;
      }

      // If not staff, attempt to load client profile
      const { data: clientProfileData, error: clientProfileError } = await supabase
        .from('client_profiles')
        .select(`
          client_id,
          client:clients(company, name, is_retainer)
        `)
        .eq('user_id', currentUser.id)
        .single();

      if (clientProfileError && clientProfileError.code !== 'PGRST116') {
        console.error('Error loading client profile:', clientProfileError);
      }
      
      if (clientProfileData) {
        console.log('Client profile loaded:', clientProfileData);
      }
      setClientProfile(clientProfileData || null);

    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setStaff(null);
      setClientProfile(null);
    }
  };

  useEffect(() => {
    console.log('AuthContext initializing...');
    
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      console.log('Auth state change:', event, session?.user?.id || 'no user');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await loadUserProfile(session.user);
        } catch (error) {
          console.error('Error loading profile during auth state change:', error);
          toast({
            title: "Profile Loading Error",
            description: "There was an issue loading your profile. Please try refreshing the page.",
            variant: "destructive",
          });
        }
      } else {
        setStaff(null);
        setClientProfile(null);
      }
      setLoading(false);
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        console.log('Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          toast({
            title: "Authentication Error",
            description: "There was an issue with authentication. Please try signing in again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        console.log('Initial session check:', session?.user?.id || 'no session');
        await handleAuthStateChange('INITIAL_LOAD', session);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log('Sign in successful');
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    // Use current domain for redirect
    const redirectUrl = `${window.location.origin}/setup-password`;
    console.log('Password reset redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error) {
      console.error('Password reset error:', error);
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
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
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
      loading,
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
