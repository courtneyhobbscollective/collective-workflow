import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useSupabase } from './SupabaseContext';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: 'admin' | 'staff') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const fetchUserProfile = async (userId: string) => {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        // If the table doesn't exist or there's no profile, return null
        // This will trigger the fallback user creation
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 second timeout
    
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setUser(null);
          setIsLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        if (data.session) {
          // Fetch user profile from profiles table
          const profile = await fetchUserProfile(data.session.user.id);
          
          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name || data.session.user.email || '',
              email: profile.email || data.session.user.email || '',
              role: profile.role || 'staff',
              avatar: profile.avatar_url || '',
              createdAt: new Date(profile.created_at),
              updatedAt: new Date(profile.updated_at)
            });
          } else {
            // Try to create a profile for the user
            try {
              const { error: createError } = await supabase!
                .from('profiles')
                .insert([
                  {
                    id: data.session.user.id,
                    name: data.session.user.user_metadata?.name || data.session.user.email || '',
                    email: data.session.user.email || '',
                    role: data.session.user.user_metadata?.role || 'staff',
                    avatar_url: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ]);
              
              if (createError) {
                console.error('Error creating profile:', createError);
                // If profile creation fails, use fallback user data
                setUser({
                  id: data.session.user.id,
                  name: data.session.user.email || '',
                  email: data.session.user.email || '',
                  role: (data.session.user.user_metadata?.role as any) || 'staff',
                  avatar: '',
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
              } else {
                // Fetch the newly created profile
                const newProfile = await fetchUserProfile(data.session.user.id);
                if (newProfile) {
                  setUser({
                    id: newProfile.id,
                    name: newProfile.name || data.session.user.email || '',
                    email: newProfile.email || data.session.user.email || '',
                    role: newProfile.role || 'staff',
                    avatar: newProfile.avatar_url || '',
                    createdAt: new Date(newProfile.created_at),
                    updatedAt: new Date(newProfile.updated_at)
                  });
                }
              }
            } catch (error) {
              console.error('Error creating profile:', error);
              // Use fallback user data
              setUser({
                id: data.session.user.id,
                name: data.session.user.email || '',
                email: data.session.user.email || '',
                role: (data.session.user.user_metadata?.role as any) || 'staff',
                avatar: '',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };
    getSession();
    
    return () => {
      clearTimeout(timeoutId);
    };
    
    // Listen for auth state changes
    const { data: listener } = supabase!.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Fetch user profile from profiles table
        const profile = await fetchUserProfile(session.user.id);
        
        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name || session.user.email || '',
            email: profile.email || session.user.email || '',
            role: profile.role || 'staff',
            avatar: profile.avatar_url || '',
            createdAt: new Date(profile.created_at),
            updatedAt: new Date(profile.updated_at)
          });
        } else {
          // Try to create a profile for the user
          try {
            const { error: createError } = await supabase!
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  name: session.user.user_metadata?.name || session.user.email || '',
                  email: session.user.email || '',
                  role: session.user.user_metadata?.role || 'staff',
                  avatar_url: '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ]);
            
            if (createError) {
              // If profile creation fails, use fallback user data
              setUser({
                id: session.user.id,
                name: session.user.email || '',
                email: session.user.email || '',
                role: (session.user.user_metadata?.role as any) || 'staff',
                avatar: '',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            } else {
              // Fetch the newly created profile
              const newProfile = await fetchUserProfile(session.user.id);
              if (newProfile) {
                setUser({
                  id: newProfile.id,
                  name: newProfile.name || session.user.email || '',
                  email: newProfile.email || session.user.email || '',
                  role: newProfile.role || 'staff',
                  avatar: newProfile.avatar_url || '',
                  createdAt: new Date(newProfile.created_at),
                  updatedAt: new Date(newProfile.updated_at)
                });
              }
            }
          } catch (error) {
            // Use fallback user data
            setUser({
              id: session.user.id,
              name: session.user.email || '',
              email: session.user.email || '',
              role: (session.user.user_metadata?.role as any) || 'staff',
              avatar: '',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      } else {
        setUser(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string) => {
    if (!supabase) {
      setError('Database connection error');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setError(error.message);
        throw error;
      }
      
      if (!data.user) {
        setError('Login failed - no user data');
        return;
      }
      // Always ensure a profile exists for the user
      let profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        // Create profile if missing
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.email || '',
              email: data.user.email || '',
              role: data.user.user_metadata?.role || 'staff',
              avatar_url: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        if (profileError) {
          setError('Login succeeded but failed to create user profile: ' + profileError.message);
          return;
        }
        profile = await fetchUserProfile(data.user.id);
      }
      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name || data.user.email || '',
          email: profile.email || data.user.email || '',
          role: profile.role || 'staff',
          avatar: profile.avatar_url || '',
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        });
      }
    } catch (error) {
      setError('Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'admin' | 'staff' = 'staff') => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    
    try {
      // Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });
      
      if (signUpError) {
        setError(signUpError.message);
        throw signUpError;
      }
      
      if (data.user) {
        // Create user profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name,
              email,
              role,
              avatar_url: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw error here as the user was created successfully in auth
          // The profile can be created later if needed
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    if (!supabase || !user) {
      console.log('refreshUser: No supabase or user');
      return;
    }
    
    try {
      console.log('refreshUser: Fetching profile for user:', user.id);
      const profile = await fetchUserProfile(user.id);
      console.log('refreshUser: Profile data:', profile);
      
      if (profile) {
        const updatedUser = {
          id: profile.id,
          name: profile.name || user.email || '',
          email: profile.email || user.email || '',
          role: profile.role || 'staff',
          avatar: profile.avatar_url || '',
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        };
        console.log('refreshUser: Setting user to:', updatedUser);
        setUser(updatedUser);
              } else {
          console.log('refreshUser: No profile found, creating one...');
          // Try to create a profile for the user
          try {
            console.log('refreshUser: Attempting to create profile with data:', {
              id: user.id,
              name: user.name || user.email || '',
              email: user.email || '',
              role: user.role || 'staff',
              avatar_url: user.avatar || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            const { data: insertData, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  name: user.name || user.email || '',
                  email: user.email || '',
                  role: user.role || 'staff',
                  avatar_url: user.avatar || '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ])
              .select();
            
            console.log('refreshUser: Insert result - data:', insertData, 'error:', createError);
            
            if (createError) {
              console.error('Error creating profile:', createError);
              // Keep the current user data if profile creation fails
            } else {
              console.log('refreshUser: Profile created successfully, fetching it...');
              // Fetch the newly created profile
              const newProfile = await fetchUserProfile(user.id);
              console.log('refreshUser: Newly fetched profile:', newProfile);
              if (newProfile) {
                const updatedUser = {
                  id: newProfile.id,
                  name: newProfile.name || user.email || '',
                  email: newProfile.email || user.email || '',
                  role: newProfile.role || 'staff',
                  avatar: newProfile.avatar_url || '',
                  createdAt: new Date(newProfile.created_at),
                  updatedAt: new Date(newProfile.updated_at)
                };
                console.log('refreshUser: Setting user to newly created profile:', updatedUser);
                setUser(updatedUser);
              } else {
                console.log('refreshUser: Failed to fetch newly created profile');
              }
            }
          } catch (error) {
            console.error('Error creating profile:', error);
            // Keep the current user data if profile creation fails
          }
        }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, isLoading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};