import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

// Configure WebBrowser for authentication
WebBrowser.maybeCompleteAuthSession();

export interface Profile {
  uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  provider: string;
  created_at: string;
  last_login: string | null;
  phone_number: string | null;
  is_email_verified: boolean;
  role: 'user' | 'admin' | 'moderator';
  metadata: Record<string, any>;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'apple') => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile for user:', userId);
          await createProfile(userId);
        } else {
          console.error('Error fetching profile:', error);
          // Set loading to false even if there's an error
          setLoading(false);
        }
      } else {
        setProfile(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        setLoading(false);
        return;
      }

      const newProfile: Omit<Profile, 'created_at' | 'updated_at'> = {
        uid: userId,
        email: user.data.user.email || null,
        display_name: user.data.user.user_metadata?.full_name || user.data.user.email?.split('@')[0] || null,
        photo_url: user.data.user.user_metadata?.avatar_url || null,
        provider: 'email',
        last_login: new Date().toISOString(),
        phone_number: user.data.user.phone || null,
        is_email_verified: user.data.user.email_confirmed_at ? true : false,
        role: 'user',
        metadata: user.data.user.user_metadata || {},
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
      } else {
        console.log('Profile created successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    return { error: result.error };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setLoading(true);
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });
    
    // If signup successful and user is created, ensure profile exists
    if (!result.error && result.data.user) {
      // Note: We don't create the profile immediately here because the user
      // needs to confirm their email first. The profile will be created
      // automatically when they first sign in after email confirmation
      // via the fetchProfile -> createProfile flow
    }
    
    setLoading(false);
    return { error: result.error };
  };

  const signOut = async () => {
    setLoading(true);
    const result = await supabase.auth.signOut();
    setLoading(false);
    return { error: result.error };
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    try {
      // For mobile platforms, use WebBrowser for OAuth
      const redirectUrl = Linking.createURL('auth/callback');
      console.log('OAuth redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      if (data.url) {
        // Open the OAuth URL in the browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          // The callback will be handled by the deep link listener
          console.log('OAuth browser session completed successfully');
        } else {
          setLoading(false);
          return { error: new Error('OAuth cancelled by user') };
        }
      }
      
      setLoading(false);
      return { error: null };
    } catch (error) {
      setLoading(false);
      console.error('OAuth error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myapp://reset-password',
    });
    return { error: result.error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const result = await supabase
      .from('profiles')
      .update(updates)
      .eq('uid', user.id);

    if (!result.error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error: result.error };
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
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
