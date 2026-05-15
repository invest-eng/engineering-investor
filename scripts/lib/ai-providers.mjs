/**
 * AI provider wrappers. All return: { text: string, model: string }
 *
 * Active providers:
 *   - Gemini (GEMINI_API_KEY)
 *
 * --- PREMIUM PROVIDERS (prepared, require API keys) ---
 *   - Anthropic Claude (ANTHROPIC_API_KEY)
 *   - OpenAI GPT (OPENAI_API_KEY)
 *
 * Each provider has retry-with-backoff on rate-limit / server errors.
 */

import { SYSTEM_PROMPT } from './prompts.mjs';

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

async function withRetry(label, fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.status || err.code;
      if (RETRY_STATUS.has(status) && attempt < MAX_ATTEMPTS) {
        const wait = Math.min(30_000, 2_000 * 2 ** (attempt - 1));
        console.warn(`[${label}] ${status} attempt ${attempt}/${MAX_ATTEMPTS}, retry in ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/* ============================================================
 * GEMINI (active)
 * ============================================================ */

const GEMINI_MODELS = (process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-2.0-flash,gemini-2.5-flash-lite')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export async function callGemini(prompt, { systemPrompt = SYSTEM_PROMPT, temperature = 0.4, maxTokens = 16000 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  };

  let lastErr;
  for (const model of GEMINI_MODELS) {
    try {
      return await withRetry(`gemini:${model}`, async () => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = new Error(`Gemini ${res.status}: ${await res.text()}`);
          err.status = res.status;
          throw err;
        }
        const json = await res.json();
        const parts = json?.candidates?.[0]?.content?.parts ?? [];
        const text = parts.map((p) => p.text || '').join('\n').trim();
        if (!text) throw new Error('Empty Gemini output');
        return { text, model };
      });
    } catch (err) {
      console.warn(`[gemini] ${model} failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw new Error(`All Gemini models failed. Last: ${lastErr?.message}`);
}

/* ============================================================
 * CLAUDE (premium, requires ANTHROPIC_API_KEY)
 * --- Currently disabled: throws if called without the key.
 *     Premium orchestrator handles this by skipping when missing.
 * ============================================================ */

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';

export async function callClaude(prompt, { systemPrompt = SYSTEM_PROMPT, temperature = 0.4, maxTokens = 8000 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY missing — Claude provider unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return await withRetry(`claude:${CLAUDE_MODEL}`, async () => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = new Error(`Claude ${res.status}: ${await res.text()}`);
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    const text = (json.content || []).map((c) => c.text || '').join('\n').trim();
    if (!text) throw new Error('Empty Claude output');
    return { text, model: CLAUDE_MODEL };
  });
}

/* ============================================================
 * OPENAI (premium, requires OPENAI_API_KEY)
 * --- Currently disabled: throws if called without the key.
 * ============================================================ */

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function callOpenAi(prompt, { systemPrompt = SYSTEM_PROMPT, temperature = 0.4, maxTokens = 8000 } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY missing — OpenAI provider unavailable');
    err.code = 'PROVIDER_UNAVAILABLE';
    throw err;
  }

  return await withRetry(`openai:${OPENAI_MODEL}`, async () => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const err = new Error(`OpenAI ${res.status}: ${await res.text()}`);
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty OpenAI output');
    return { text, model: OPENAI_MODEL };
  });
}

/* ============================================================
 * Registry — returns active providers based on available keys.
 * ============================================================ */

export function availableProviders() {
  const providers = [];
  if (process.env.GEMINI_API_KEY) providers.push({ name: 'gemini', call: callGemini });
  if (process.env.ANTHROPIC_API_KEY) providers.push({ name: 'claude', call: callClaude });
  if (process.env.OPENAI_API_KEY) providers.push({ name: 'openai', call: callOpenAi });
  return providers;
}
