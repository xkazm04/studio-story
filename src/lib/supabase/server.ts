/**
 * Supabase Server Client
 * Server-side Supabase instance with service role key
 * Use this for API routes and server components
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase server environment variables');
}

/**
 * Server-side Supabase client with service role access
 * Bypasses RLS for admin operations
 */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Gets Supabase client for specific user (respects RLS)
 * Use this when you want RLS policies to apply
 */
export const getSupabaseForUser = (userId: string) => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        // Set user context for RLS
        'X-User-Id': userId,
      },
    },
  });
};


