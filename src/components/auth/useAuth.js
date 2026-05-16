/**
 * useAuth — React hook that exposes auth state across islands.
 *
 * Each island that calls useAuth() opens its own subscription to
 * supabase.auth.onAuthStateChange(). Supabase keeps a single underlying
 * session in localStorage, so all islands stay in sync via storage events.
 *
 * Defensive design:
 *  - All async calls wrapped in try/catch so failures never leave loading=true.
 *  - 8s safety timeout: if neither getSession nor onAuthStateChange resolves,
 *    we force loading=false (degraded mode, treat as logged out).
 */

import { useEffect, useState } from 'react';
import { supabase, isAuthConfigured, fetchProfile } from '../../lib/supabase.js';

const SAFETY_TIMEOUT_MS = 8000;

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
    let settled = false;
    const settle = () => {
      if (!settled && active) {
        settled = true;
        setLoading(false);
      }
    };

    // Safety net: if Supabase never responds (network issue, hung promise),
    // unblock the UI after a few seconds so the user can at least see content.
    const safetyTimer = setTimeout(() => {
      if (!settled) {
        console.warn('[useAuth] supabase auth check timed out — degrading to logged-out');
        settle();
      }
    }, SAFETY_TIMEOUT_MS);

    async function applySession(session) {
      if (!active) return;
      const u = session?.user || null;
      setUser(u);
      if (u) {
        try {
          const p = await fetchProfile(u.id);
          if (active) setProfile(p);
        } catch (err) {
          console.warn('[useAuth] fetchProfile failed', err);
        }
      } else {
        setProfile(null);
      }
      settle();
    }

    // 1) Read current session right away.
    supabase.auth.getSession()
      .then(({ data }) => applySession(data?.session || null))
      .catch((err) => {
        console.warn('[useAuth] getSession failed', err);
        settle();
      });

    // 2) Subscribe to future changes (login, logout, refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      active = false;
      clearTimeout(safetyTimer);
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
