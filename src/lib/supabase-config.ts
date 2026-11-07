/**
 * Public Supabase connection settings for the Riftcards project.
 * The publishable key is designed to ship inside client apps; data is protected by Row Level Security.
 * EXPO_PUBLIC_* environment variables (e.g. in .env.local) override these values.
 * NEVER put the secret / service_role key here.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://hyqtaaapshvupstjldxm.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_dZSBo21ZEvSQG8iuhpAgRQ_9mUmI60G';
