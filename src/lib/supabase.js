/**
 * Supabase client — singleton.
 *
 * Returns `null` when env vars are missing (e.g. local dev without .env).
 * UI components should gracefully degrade to "offline / localStorage only"
 * mode in that case.
 */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isAuthConfigured = !!supabase;

/**
 * Fetch the current user's profile row (includes is_premium flag).
 * Returns null if not authenticated or profile missing.
 */
export async function fetchProfile(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[supabase] fetchProfile error:', error.message);
    return null;
  }
  return data;
}

/**
 * Load the user's tracker JSON blob.
 * Returns null if missing (first-time user).
 */
export async function loadTrackerData(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('user_tracker_data')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[supabase] loadTrackerData error:', error.message);
    return null;
  }
  return data;
}

/**
 * Upsert the user's tracker JSON blob.
 */
export async function saveTrackerData(userId, data) {
  if (!supabase || !userId) return { error: 'not configured' };
  const { error } = await supabase
    .from('user_tracker_data')
    .upsert({
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    });
  if (error) {
    console.warn('[supabase] saveTrackerData error:', error.message);
    return { error: error.message };
  }
  return { ok: true };
}
