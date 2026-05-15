/**
 * Text-to-Speech via Google Cloud TTS.
 *
 * Uses Slovenian Neural2 voice (sl-SI-Standard-A or sl-SI-Standard-B).
 * Returns MP3 buffer.
 *
 * Free tier: 1M chars/month standard, 1M chars/month wavenet/neural.
 *
 * --- AUTH OPTIONS ---
 * Option A (simple, used here): API key.
 *   Set GOOGLE_TTS_API_KEY in env. Enable "Cloud Text-to-Speech API" in your
 *   Google Cloud project and create an API key restricted to that service.
 * Option B (more secure, future): service account JSON.
 *   Would require @google-cloud/text-to-speech package.
 *
 * If GOOGLE_TTS_API_KEY is missing, throws PROVIDER_UNAVAILABLE.
 */

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * Synthesize Slovenian speech from text.
 * @param {string} text - Plain text to read. Avoid markdown, abbreviations.
 * @param {object} opts
 * @param {string} opts.voice - 'sl-SI-Standard-A' (F) | 'sl-SI-Standard-B' (M).
 *                              Standard voices are free; wavenet/neural cost more.
 * @param {number} opts.rate  - speaking rate (0.25 - 4.0, default 1.0)
 * @param {number} opts.pitch - pitch (-20.0 to 20.0 semitones, default 0)
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
export async function synthesizeSlovenian(text, { voice = 'sl-SI-Standard-A', rate = 1.0, pitch = 0 } = {}) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    const err = new Error('GOOGLE_TTS_API_KEY missing — TTS provider unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  // Soundscape preprocessing: replace tricky abbreviations / numerics.
  const cleaned = preprocessForTts(text);

  const body = {
    input: { text: cleaned },
    voice: {
      languageCode: 'sl-SI',
      name: voice,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: rate,
      pitch,
      sampleRateHertz: 24000,
    },
  };

  const url = `${TTS_ENDPOINT}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Google TTS ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (!json.audioContent) throw new Error('Empty audioContent from Google TTS');

  return Buffer.from(json.audioContent, 'base64');
}

/**
 * Common Slovenian-friendly substitutions to improve TTS quality.
 * Add more as needed when you hear bad pronunciations.
 */
function preprocessForTts(text) {
  return text
    .replace(/\bQ1\b/g, 'prvo četrtletje')
    .replace(/\bQ2\b/g, 'drugo četrtletje')
    .replace(/\bQ3\b/g, 'tretje četrtletje')
    .replace(/\bQ4\b/g, 'četrto četrtletje')
    .replace(/\bECB\b/g, 'Evropska centralna banka')
    .replace(/\bFed\b/g, 'Federal Reserve')
    .replace(/\bAI\b/g, 'umetna inteligenca')
    .replace(/\bUSD\b/g, 'ameriški dolar')
    .replace(/\bEUR\b/g, 'evro')
    .replace(/\bGBP\b/g, 'britanski funt')
    .replace(/\b%\b/g, ' odstotkov')
    .replace(/\$(\d)/g, '$1 dolarjev')
    .replace(/€(\d)/g, '$1 evrov');
}
