import { useState } from 'react';
import { useAuth } from './useAuth.js';
import AuthModal from './AuthModal.jsx';

/**
 * AccessGate, wraps children behind auth + premium checks.
 *
 * Props:
 *  - requirePremium: boolean (default false)
 *  - title / description: shown when locked
 *  - children: rendered when access granted
 */
export default function AccessGate({
  requirePremium = false,
  title = 'Funkcija za prijavljene',
  description,
  children,
}) {
  const { user, profile, loading, isAuthenticated, isPremium, isConfigured } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Nalagam …
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <LockedShell
        kind="config"
        title="Prijava trenutno ni na voljo"
        description="Skrbnik strani še ni dokončal nastavitve uporabniških računov. Vrni se kasneje ali nadaljuj brez prijave."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LockedShell
          kind="auth"
          title={title}
          description={description || 'Sledilnik osebnih financ je na voljo prijavljenim uporabnikom. Brezplačna registracija, brez kreditne kartice.'}
          onAction={() => setModalOpen(true)}
          actionLabel="Prijava / Registracija"
        />
        <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (requirePremium && !isPremium) {
    return (
      <LockedShell
        kind="premium"
        title="Premium funkcija"
        description="Sledilnik osebnih financ s sinhronizacijo prek naprav je del premium dostopa. Prijavljen si, a tvoj račun še nima premium statusa."
        actionLabel="Spoznaj Premium"
        actionHref="/premium"
      />
    );
  }

  return <>{children}</>;
}

function LockedShell({ kind, title, description, onAction, actionLabel, actionHref }) {
  const iconColor = kind === 'premium' ? '#D97706' : kind === 'auth' ? 'var(--color-accent)' : 'var(--color-text-subtle)';

  return (
    <div style={{
      maxWidth: 560,
      margin: '4rem auto',
      padding: '2.5rem 2rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      textAlign: 'center',
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: 56,
        height: 56,
        margin: '0 auto 1rem',
        borderRadius: '50%',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: iconColor,
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h2 style={{
        margin: '0 0 0.6rem',
        fontSize: '1.35rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--color-text)',
      }}>{title}</h2>
      <p style={{
        margin: '0 0 1.5rem',
        color: 'var(--color-text-muted)',
        fontSize: '0.95rem',
        lineHeight: 1.65,
      }}>{description}</p>
      {(onAction || actionHref) && (
        actionHref ? (
          <a href={actionHref} style={btnStyle}>{actionLabel}</a>
        ) : (
          <button onClick={onAction} style={btnStyle}>{actionLabel}</button>
        )
      )}
    </div>
  );
}

const btnStyle = {
  display: 'inline-block',
  padding: '0.65rem 1.4rem',
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: '0.92rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textDecoration: 'none',
};
