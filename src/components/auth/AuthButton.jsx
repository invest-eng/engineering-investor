import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth.js';
import { supabase } from '../../lib/supabase.js';
import AuthModal from './AuthModal.jsx';

export default function AuthButton({ baseUrl = '' }) {
  const { user, profile, loading, isConfigured } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    if (supabase) await supabase.auth.signOut();
  }

  // Show static "Prijava" button while loading or when not configured (server-rendered first frame)
  if (loading) {
    return (
      <button style={btnStyle} disabled>
        …
      </button>
    );
  }

  if (!user) {
    return (
      <>
        <button onClick={() => setModalOpen(true)} style={btnStyle}>
          Prijava
        </button>
        <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const email = user.email || '';
  const initial = (profile?.full_name || email).charAt(0).toUpperCase();
  const isPremium = !!profile?.is_premium;

  return (
    <div ref={menuRef} className="auth-btn" style={{ position: 'relative' }}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Tvoj račun"
        className="auth-btn__trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px 4px 4px',
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: 999,
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--color-text)',
          fontSize: '0.85rem',
        }}
      >
        <span style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          fontWeight: 700,
          flexShrink: 0,
          border: isPremium ? '2px solid #D97706' : 'none',
          boxShadow: isPremium ? '0 0 0 1px #FFF7ED' : 'none',
        }}>{initial}</span>
        {isPremium && (
          <span className="auth-btn__premium" style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#D97706',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>★ Premium</span>
        )}
        <span className="auth-btn__chev" style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>▾</span>
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          minWidth: 220,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '0.5rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          zIndex: 150,
        }}>
          <div style={{
            padding: '0.5rem 0.7rem',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 4,
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {profile?.full_name || 'Račun'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
              {email}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', marginTop: 4 }}>
              {isPremium ? '★ Premium uporabnik' : 'Brezplačni račun'}
            </div>
          </div>
          <a href={baseUrl + '/sledilnik'} style={menuItemStyle}>Sledilnik</a>
          <a href={baseUrl + '/premium'} style={menuItemStyle}>{isPremium ? 'Premium' : 'Nadgradi v Premium'}</a>
          <button onClick={handleSignOut} style={{ ...menuItemStyle, color: '#dc2626', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
            Odjava
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: 'var(--color-text)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  padding: '0.375rem 1rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const menuItemStyle = {
  display: 'block',
  padding: '0.5rem 0.7rem',
  fontSize: '0.85rem',
  color: 'var(--color-text)',
  textDecoration: 'none',
  borderRadius: 4,
};
