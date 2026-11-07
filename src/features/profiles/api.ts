import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { PROFILE_COLUMNS, useAuth } from '../auth/auth-provider';
import type { Profile } from '../types';

export const USERNAME_PATTERN = /^[A-Za-z0-9_.]{3,20}$/;

export type ProfileInput = {
  username: string;
  country_code: string;
  city: string;
  avatar_background: number;
  avatar_symbol: number | null;
};

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_username_available', { p_username: username });
  if (error) throw error;
  return Boolean(data);
}

export function useSaveProfile() {
  const { userId, refreshProfile } = useAuth();
  return useMutation({
    mutationFn: async (input: ProfileInput) => {
      if (!userId) throw new Error('not_authenticated');
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...input, username: input.username.trim(), city: input.city.trim() });
      if (error) throw error;
    },
    onSuccess: refreshProfile,
  });
}

export function useProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', profileId!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: Boolean(profileId),
  });
}

export type ProfileStats = { followers: number; following: number; posts: number; is_following: boolean };

export function useProfileStats(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile-stats', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('profile_stats', { p_profile_id: profileId! });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as ProfileStats | undefined;
      return {
        followers: Number(row?.followers ?? 0),
        following: Number(row?.following ?? 0),
        posts: Number(row?.posts ?? 0),
        is_following: Boolean(row?.is_following),
      };
    },
    enabled: Boolean(profileId),
  });
}

export function useToggleFollow(profileId: string) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (follow: boolean) => {
      if (!userId) throw new Error('not_authenticated');
      const result = follow
        ? await supabase.from('follows').insert({ follower_id: userId, following_id: profileId })
        : await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', profileId);
      if (result.error) throw result.error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
