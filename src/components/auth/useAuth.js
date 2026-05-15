/**
 * useAuth — React hook that exposes auth state across islands.
 *
 * Each island that calls useAuth() opens its own subscription to
 * supabase.auth.onAuthStateChange(). Supabase keeps a single underlying
 * session in localStorage, so all islands stay in sync via storage events.
 */

import { useEffect, useState } from 'react';
import { supabase, isAuthConfigured, fetchProfile } from '../../lib/supabase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadProfileFor(uid) {
      const p = await fetchProfile(uid);
      if (active) setProfile(p);
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const u = data.session?.user || null;
      setUser(u);
      if (u) await loadProfileFor(u.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const u = session?.user || null;
      setUser(u);
      if (u) await loadProfileFor(u.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isPremium: !!profile?.is_premium,
    isConfigured: isAuthConfigured,
  };
}
