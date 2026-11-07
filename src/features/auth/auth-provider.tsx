import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import type { Profile } from '../types';

type AuthContextValue = {
  session: Session | null;
  userId: string | null;
  profile: Profile | null;
  /** True until the stored session (and profile, if signed in) have been resolved. */
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const PROFILE_COLUMNS = 'id, username, country_code, city, avatar_background, avatar_symbol, bio, created_at';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session);
      })
      .finally(() => {
        if (mounted) setSessionLoaded(true);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });

  const refreshProfile = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['profile', userId] });
  }, [queryClient, userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      userId,
      profile: profileQuery.data ?? null,
      isLoading: !sessionLoaded || (Boolean(userId) && profileQuery.isPending),
      refreshProfile,
      signOut,
    }),
    [session, userId, profileQuery.data, profileQuery.isPending, sessionLoaded, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}

/** For screens that are only reachable when signed in with a completed profile. */
export function useCurrentProfile(): Profile {
  const { profile } = useAuth();
  if (!profile) throw new Error('useCurrentProfile used without a profile.');
  return profile;
}
