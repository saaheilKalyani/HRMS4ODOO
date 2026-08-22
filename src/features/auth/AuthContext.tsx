import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { onAuthStateChange } from '../../lib/supabase/auth';
import {
  signIn as serviceSignIn,
  signUp as serviceSignUp,
  signOut as serviceSignOut,
  getCurrentUser,
  mapSupabaseError,
  type SignInInput,
  type SignUpInput,
  type SignUpResult,
} from './auth.service';
import type { Profile, Employee } from '../../types';

interface AuthContextValue {
  authUser: { id: string; email: string } | null;
  profile: Profile | null;
  employee: Employee | null;
  loading: boolean;
  signIn: (input: SignInInput) => Promise<{ error: any } | { error: null }>;
  signUp: (input: SignUpInput) => Promise<{ error: any; data?: SignUpResult | null } | { error: null; data?: SignUpResult | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /**
   * Back-compat aliases so components written against the old mock
   * auth-context shape (`user.profile`, `user.employee`, `isLoading`)
   * keep working unchanged now that this is the live provider.
   */
  user: { profile: Profile; employee: Employee } | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const applyCurrentUser = async (_userId: string) => {
    try {
      const { data, error } = await getCurrentUser();
      if (error || !data) {
        setAuthUser(null);
        setProfile(null);
        setEmployee(null);
        return;
      }
      setAuthUser(data.auth_user);
      setProfile(data.profile);
      setEmployee(data.employee);
    } catch (err) {
      setAuthUser(null);
      setProfile(null);
      setEmployee(null);
    }
  };

  const refreshUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('refreshUser failed:', mapSupabaseError(error));
    }
    if (user) {
      await applyCurrentUser(user.id);
    } else {
      setAuthUser(null);
      setProfile(null);
      setEmployee(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Failed to load session:', mapSupabaseError(error));
      }
      if (session?.user) {
        await applyCurrentUser(session.user.id);
      }
      if (mounted) setLoading(false);
    };

    init();

    const { data: authListener } = onAuthStateChange((_event, session) => {
      if (session?.user) {
        applyCurrentUser(session.user.id);
      } else {
        setAuthUser(null);
        setProfile(null);
        setEmployee(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (input: SignInInput) => {
    const result = await serviceSignIn(input);
    if (result.error) return { error: result.error };
    if (result.data) {
      setAuthUser({ id: result.data.user.id, email: result.data.user.email ?? '' });
      setProfile(result.data.profile);
      const empResult = await getCurrentUser();
      setEmployee(empResult.data?.employee ?? null);
    }
    return { error: null };
  };

  const signUp = async (input: SignUpInput) => {
    const result = await serviceSignUp(input);
    if (result.error) return { error: result.error };
    return { error: null, data: result.data };
  };

  const signOut = async () => {
    await serviceSignOut();
    setAuthUser(null);
    setProfile(null);
    setEmployee(null);
  };

  const value: AuthContextValue = {
    authUser,
    profile,
    employee,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    user: profile && employee ? { profile, employee } : null,
    isLoading: loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};