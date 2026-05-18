import { useEffect, useRef, useState } from 'react';

/**
 * AudioReader, Slovenian voice reader with 5s skip controls.
 *
 * Reads either:
 *  - explicit `text` prop, or
 *  - text content of element matching `selector` (extracted on mount).
 *
 * Audio source priority:
 *  1. `src` prop → pre-generated MP3 (Google Cloud TTS premium)
 *  2. fallback → browser speechSynthesis (preview quality)
 *
 * Skip handling:
 *  - MP3: native `audio.currentTime ± 5`.
 *  - TTS: estimate char/sec from playback so far, cancel current utterance,
 *    restart from new char offset (no native seeking in the SpeechSynthesis API).
 */
export default function AudioReader({
  text,
  selector,
  src,
  label = 'Poslušaj',
  sublabel,
  premium = true,
}) {
  const [resolvedText, setResolvedText] = useState(text || '');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef(null);
  const charIndexRef = useRef(0);
  const startTimeRef = useRef(0);
  const charPerSecRef = useRef(14); // initial estimate ~14 chars/sec at rate 0.95
  const utterRef = useRef(null);

  // Extract text from DOM if a selector was given.
  useEffect(() => {
    if (text) {
      setResolvedText(text);
      return;
    }
    if (!selector || typeof document === 'undefined') return;
    const el = document.querySelector(selector);
    if (!el) return;
    const clone = el.cloneNode(true);
    clone.querySelectorAll('script, style, figure').forEach((n) => n.remove());
    const t = clone.textContent.replace(/\s+/g, ' ').trim();
    setResolvedText(t);
  }, [text, selector]);

  // Cleanup on unmount: stop any in-flight speech.
  useEffect(() => () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  function startSpeech(baseIndex = 0) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (!resolvedText) return;
    const slice = resolvedText.slice(baseIndex);
    if (!slice) return;

    const utter = new SpeechSynthesisUtterance(slice);
    utter.lang = 'sl-SI';
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const slo = voices.find((v) => v.lang?.startsWith('sl'));
    if (slo) utter.voice = slo;

    startTimeRef.current = Date.now();
    charIndexRef.current = baseIndex;

    utter.onstart = () => setPlaying(true);
    utter.onend = () => {
      setPlaying(false);
      setProgress(0);
      charIndexRef.current = 0;
    };
    utter.onerror = () => setPlaying(false);
    utter.onboundary = (e) => {
      if (e.charIndex === undefined) return;
      const abs = baseIndex + e.charIndex;
      charIndexRef.current = abs;
      // Update char/sec estimate (more accurate over time)
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (elapsed > 1 && e.charIndex > 0) {
        charPerSecRef.current = e.charIndex / elapsed;
      }
      if (resolvedText.length) {
        setProgress(Math.min(100, (abs / resolvedText.length) * 100));
      }
    };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }

  function togglePlay() {
    if (src && audioRef.current) {
      if (playing) audioRef.current.pause();
      else audioRef.current.play();
      return;
    }
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    startSpeech(0);
  }

  function skip(seconds) {
    if (src && audioRef.current) {
      const a = audioRef.current;
      const dur = a.duration || 0;
      a.currentTime = Math.max(0, Math.min(dur, a.currentTime + seconds));
      return;
    }
    if (!playing || !resolvedText) return;
    const charDelta = Math.round(seconds * charPerSecRef.current);
    const newIndex = Math.max(0, Math.min(resolvedText.length - 1, charIndexRef.current + charDelta));
    window.speechSynthesis.cancel();
    // Tiny delay because cancel is async on some browsers.
    setTimeout(() => startSpeech(newIndex), 50);
  }

  const minutes = Math.max(1, Math.round(resolvedText.length / 900));
  const computedSublabel = sublabel || (src
    ? 'Slovenski avdio · Google Cloud TTS'
    : `Slovenski avdio · približno ${minutes} min`);

  const skipBtnStyle = (disabled) => ({
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: '50%',
    border: '1px solid var(--color-border-strong)',
    background: 'var(--color-bg)',
    color: disabled ? 'var(--color-text-subtle)' : 'var(--color-text-muted)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.62rem',
    fontWeight: 600,
    padding: 0,
    fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s',
    letterSpacing: 0,
    gap: 1,
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.7rem',
      padding: '0.8rem 1rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      margin: '1.25rem 0 1.75rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {playing && (
        <div style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: 2,
          width: `${progress}%`,
          background: 'var(--color-accent)',
          transition: 'width 0.3s linear',
        }} />
      )}

      <button
        onClick={() => skip(-5)}
        aria-label="Nazaj 5 sekund"
        disabled={!playing && !src}
        style={skipBtnStyle(!playing && !src)}
        title="Nazaj 5s"
      >
        <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>↺</span>
        <span style={{ fontSize: '0.58rem', marginLeft: 1 }}>5</span>
      </button>

      <button
        onClick={togglePlay}
        aria-label={playing ? 'Ustavi predvajanje' : label}
        style={{
          width: 42, height: 42, minWidth: 42,
          borderRadius: '50%',
          border: '1px solid var(--color-border-strong)',
          background: playing ? 'var(--color-accent)' : 'var(--color-bg)',
          color: playing ? '#fff' : 'var(--color-text)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          padding: 0,
          transition: 'all 0.15s',
          fontFamily: 'inherit',
        }}
      >
        {playing ? '❚❚' : '▶'}
      </button>

      <button
        onClick={() => skip(5)}
        aria-label="Naprej 5 sekund"
        disabled={!playing && !src}
        style={skipBtnStyle(!playing && !src)}
        title="Naprej 5s"
      >
        <span style={{ fontSize: '0.95rem', lineHeight: 1, transform: 'scaleX(-1)' }}>↺</span>
        <span style={{ fontSize: '0.58rem', marginLeft: 1 }}>5</span>
      </button>

      <div style={{ flex: 1, minWidth: 0, marginLeft: 4 }}>
        <div style={{
          fontSize: '0.86rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          {label}
          {premium && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#D97706',
              background: '#FFF7ED',
              border: '1px solid #FDE68A',
              borderRadius: 4,
            }}>★ Premium</span>
          )}
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)', marginTop: 2 }}>
          {computedSublabel}
        </div>
      </div>

      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="none"
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}
    </div>
  );
}
