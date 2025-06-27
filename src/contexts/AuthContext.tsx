
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Staff } from '@/types/staff';

interface ClientProfile {
  client_id: string;
  client: {
    company: string;
    name: string;
    is_retainer: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  staff: Staff | null;
  clientProfile: ClientProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthContext initializing...');

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading
    loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Auth loading timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    const initializeAuth = async () => {
      try {
        console.log('Checking for existing session...');
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('Initial session:', initialSession?.user?.email || 'No session');

        if (initialSession?.user && mounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Try to fetch staff profile first
          try {
            const { data: staffData, error: staffError } = await supabase
              .from('staff')
              .select('*')
              .eq('email', initialSession.user.email)
              .eq('is_active', true)
              .single();

            if (staffError && staffError.code !== 'PGRST116') {
              console.error('Staff fetch error:', staffError);
            } else if (staffData && mounted) {
              console.log('Staff profile loaded:', staffData.name);
              // Transform database data to match our Staff interface
              const transformedStaff: Staff = {
                ...staffData,
                department: staffData.department || 'General',
                invitation_status: (staffData.invitation_status as 'pending' | 'invited' | 'accepted') || 'pending'
              };
              setStaff(transformedStaff);
            } else {
              // If no staff profile, try to fetch client profile
              try {
                const { data: clientData, error: clientError } = await supabase
                  .from('client_profiles')
                  .select(`
                    client_id,
                    client:clients(
                      company,
                      name,
                      is_retainer
                    )
                  `)
                  .eq('user_id', initialSession.user.id)
                  .single();

                if (clientError && clientError.code !== 'PGRST116') {
                  console.error('Client profile fetch error:', clientError);
                } else if (clientData && mounted) {
                  console.log('Client profile loaded:', clientData.client.name);
                  setClientProfile(clientData);
                }
              } catch (clientFetchError) {
                console.error('Client profile fetch exception:', clientFetchError);
              }
            }
          } catch (staffFetchError) {
            console.error('Staff fetch exception:', staffFetchError);
          }
        }

        if (mounted) {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email || 'no user');
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch staff profile when user signs in
          supabase
            .from('staff')
            .select('*')
            .eq('email', session.user.email)
            .eq('is_active', true)
            .single()
            .then(({ data: staffData, error }) => {
              if (error && error.code !== 'PGRST116') {
                console.error('Staff profile error:', error);
                // Try client profile if staff fails
                return supabase
                  .from('client_profiles')
                  .select(`
                    client_id,
                    client:clients(
                      company,
                      name,
                      is_retainer
                    )
                  `)
                  .eq('user_id', session.user.id)
                  .single();
              } else if (staffData && mounted) {
                // Transform database data to match our Staff interface
                const transformedStaff: Staff = {
                  ...staffData,
                  department: staffData.department || 'General',
                  invitation_status: (staffData.invitation_status as 'pending' | 'invited' | 'accepted') || 'pending'
                };
                setStaff(transformedStaff);
                return null;
              }
              return null;
            })
            .then((clientResult) => {
              if (clientResult) {
                const { data: clientData, error: clientError } = clientResult;
                if (clientError && clientError.code !== 'PGRST116') {
                  console.error('Client profile error:', clientError);
                } else if (clientData && mounted) {
                  setClientProfile(clientData);
                }
              }
            });
        } else {
          setStaff(null);
          setClientProfile(null);
        }
        
        if (!loading) {
          setLoading(false);
        }
      }
    });

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign in exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        setUser(null);
        setSession(null);
        setStaff(null);
        setClientProfile(null);
        console.log('Signed out successfully');
      }
    } catch (error) {
      console.error('Sign out exception:', error);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Auth state:', { 
      user: user?.email, 
      staff: staff?.name,
      clientProfile: clientProfile?.client?.name,
      loading,
      hasSession: !!session 
    });
  }, [user, staff, clientProfile, loading, session]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      staff,
      clientProfile,
      loading,
      signOut,
      signIn
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
