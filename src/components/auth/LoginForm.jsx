import { useState } from 'react';
import { supabase, isAuthConfigured } from '../../lib/supabase.js';

const MODE = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  RESET: 'reset',
};

export default function LoginForm({ onSuccess, compact = false }) {
  const [mode, setMode] = useState(MODE.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isAuthConfigured) {
      setError('Prijava trenutno ni na voljo. Skrbnik strani še ni dokončal nastavitev.');
      return;
    }

    setLoading(true);
    try {
      if (mode === MODE.LOGIN) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onSuccess) onSuccess();
      } else if (mode === MODE.SIGNUP) {
        if (password.length < 8) {
          throw new Error('Geslo mora imeti vsaj 8 znakov.');
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfo('Račun ustvarjen. Preveri email za potrditveno povezavo.');
        } else if (onSuccess) {
          onSuccess();
        }
      } else if (mode === MODE.RESET) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setInfo('Če račun obstaja, smo poslali povezavo za ponastavitev gesla.');
      }
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === MODE.LOGIN ? 'Prijava' :
    mode === MODE.SIGNUP ? 'Ustvari račun' :
    'Pozabljeno geslo';

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontFamily: 'inherit' }}>
      {!compact && (
        <div style={{ marginBottom: '0.4rem' }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--color-text)',
          }}>
            {title}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {mode === MODE.LOGIN && 'Dobrodošli nazaj.'}
            {mode === MODE.SIGNUP && 'Brezplačen račun, samo email in geslo.'}
            {mode === MODE.RESET && 'Vnesi email, da prejmeš povezavo za ponastavitev.'}
          </p>
        </div>
      )}

      <Field label="Email">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          placeholder="ime@primer.si"
        />
      </Field>

      {mode !== MODE.RESET && (
        <Field label="Geslo">
          <input
            type="password"
            required
            autoComplete={mode === MODE.LOGIN ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder={mode === MODE.SIGNUP ? 'Vsaj 8 znakov' : ''}
            minLength={8}
          />
        </Field>
      )}

      {error && (
        <div style={{
          padding: '0.6rem 0.8rem',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 6,
          fontSize: '0.85rem',
          color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      {info && (
        <div style={{
          padding: '0.6rem 0.8rem',
          background: 'rgba(5,150,105,0.08)',
          border: '1px solid rgba(5,150,105,0.3)',
          borderRadius: 6,
          fontSize: '0.85rem',
          color: '#059669',
        }}>
          {info}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '0.7rem 1rem',
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: '0.92rem',
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          marginTop: 4,
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {loading ? 'Pošiljam…' : (
          mode === MODE.LOGIN ? 'Prijavi se' :
          mode === MODE.SIGNUP ? 'Ustvari račun' :
          'Pošlji povezavo'
        )}
      </button>

      <div style={{
        marginTop: '0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        fontSize: '0.82rem',
      }}>
        {mode === MODE.LOGIN && (
          <>
            <SwitchButton onClick={() => setMode(MODE.SIGNUP)}>
              Še nimam računa &middot; <strong>Ustvari račun</strong>
            </SwitchButton>
            <SwitchButton onClick={() => setMode(MODE.RESET)}>
              Pozabljeno geslo?
            </SwitchButton>
          </>
        )}
        {mode === MODE.SIGNUP && (
          <SwitchButton onClick={() => setMode(MODE.LOGIN)}>
            Že imam račun &middot; <strong>Prijava</strong>
          </SwitchButton>
        )}
        {mode === MODE.RESET && (
          <SwitchButton onClick={() => setMode(MODE.LOGIN)}>
            ← Nazaj na prijavo
          </SwitchButton>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{
        fontSize: '0.72rem',
        color: 'var(--color-text-subtle)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  color: 'var(--color-text)',
  fontSize: '0.92rem',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

function SwitchButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
        textAlign: 'center',
        padding: 4,
        fontFamily: 'inherit',
        fontSize: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function translateError(msg) {
  if (!msg) return 'Neznana napaka.';
  if (msg.includes('Invalid login credentials')) return 'Napačen email ali geslo.';
  if (msg.includes('User already registered')) return 'Račun s tem emailom že obstaja.';
  if (msg.includes('Email not confirmed')) return 'Email še ni potrjen. Preveri prejeto pošto.';
  if (msg.includes('rate limit')) return 'Preveč poskusov. Počakaj nekaj minut.';
  return msg;
}
