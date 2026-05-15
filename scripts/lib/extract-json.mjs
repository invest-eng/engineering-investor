/**
 * Robust JSON extraction from LLM output.
 * Handles markdown fences, prefix/suffix prose, partial outputs.
 */

export function extractJson(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('extractJson: empty input');
  }
  // Try fenced first.
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
    return JSON.parse(candidate.slice(aStart, aEnd + 1));
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
