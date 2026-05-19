/**
 * Robust JSON extraction from LLM output.
 * Handles markdown fences, prefix/suffix prose, truncated outputs, trailing commas.
 */

function tryParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function repairJson(str) {
  // Remove trailing commas before ] or }
  let s = str.replace(/,\s*([}\]])/g, '$1');
  const r = tryParse(s);
  if (r) return r;

  // If JSON is truncated mid-array, try closing open structures.
  // Count unclosed braces/brackets and append closing tokens.
  let depth = 0;
  let inString = false;
  let escape = false;
  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
  }

  // Truncated — strip back to last complete top-level value and close.
  // Simpler heuristic: find last complete "}" for a novice item and close the array + root.
  const lastClose = s.lastIndexOf('"}');
  if (lastClose !== -1 && depth > 0) {
    s = s.slice(0, lastClose + 2);
    // Close remaining open structures: depth levels of ] or }
    // We only know the root is an object with a "novice" array, so close those.
    s = s + ']}'.repeat(0) + (depth > 1 ? ']}' : '}');
    const r2 = tryParse(s.replace(/,\s*([}\]])/g, '$1'));
    if (r2) return r2;
  }

  return null;
}

export function extractJson(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('extractJson: empty input');
  }
  // Try fenced block first.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    // Maybe array root.
    const aStart = candidate.indexOf('[');
    const aEnd = candidate.lastIndexOf(']');
    if (aStart === -1 || aEnd === -1) {
      throw new Error('No JSON found in model output:\n' + text.slice(0, 500));
    }
    const r = tryParse(candidate.slice(aStart, aEnd + 1));
    if (r) return r;
    throw new Error('JSON array parse failed:\n' + candidate.slice(aStart, aEnd + 1).slice(0, 500));
  }

  const slice = candidate.slice(start, end + 1);

  // 1. Direct parse
  const direct = tryParse(slice);
  if (direct) return direct;

  // 2. Repair (trailing commas, truncation)
  const repaired = repairJson(slice);
  if (repaired) {
    console.warn('[extractJson] used repaired JSON — Gemini output may have been truncated');
    return repaired;
  }

  throw new SyntaxError('JSON parse failed even after repair:\n' + slice.slice(0, 500));
}
