import { buildPRDPrompt } from './prompt.js';
import { routeToProvider } from './llmRouter.js';

/**
 * Strip markdown code fences (```json ... ```) from a string and retry JSON parse.
 * Returns parsed object or null if unrecoverable.
 */
function extractJSON(raw) {
  // 1) Try direct parse
  try { return JSON.parse(raw); } catch { /* keep going */ }

  // 2) Strip code fences
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try { return JSON.parse(fence[1]); } catch { /* keep going */ }
  }

  // 3) Try to find the first { and last } and re-parse
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch { /* keep going */ }
  }

  return null;
}

/**
 * Normalize potentially malformed/semi-structured LLM output into the strict
 * response shape expected by the frontend.
 */
function normalizeOutput(parsed) {
  return {
    prd: typeof parsed.prd === 'string' ? parsed.prd : '',
    userStories: Array.isArray(parsed.userStories)
      ? parsed.userStories.map((s, i) => ({
          id: s.id || `US-${String(i + 1).padStart(3, '0')}`,
          asA: typeof s.asA === 'string' ? s.asA : '',
          iWantTo: typeof s.iWantTo === 'string' ? s.iWantTo : '',
          soThatICan: typeof s.soThatICan === 'string' ? s.soThatICan : '',
          acceptanceCriteria: Array.isArray(s.acceptanceCriteria)
            ? s.acceptanceCriteria.map(String)
            : [],
        }))
      : [],
    functionalRequirements: Array.isArray(parsed.functionalRequirements)
      ? parsed.functionalRequirements.map(String)
      : [],
    uiUxWireframes: typeof parsed.uiUxWireframes === 'string' ? parsed.uiUxWireframes : '',
  };
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function handleGenerate(req, res) {
  const { transcript, modelKey, customKey, customModel } = req.body;

  // ── Validation ───────────────────────────────────────────────────────────
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return res.status(400).json({ error: 'Transcript is required.' });
  }
  if (!modelKey || typeof modelKey !== 'string') {
    return res.status(400).json({ error: 'modelKey is required.' });
  }

  const validKeys = new Set([
    'mimo-standard','mimo-pro',
    'openai-mini','openai-pro',
    'claude-haiku','claude-sonnet',
    'gemini-flash','gemini-pro',
    'custom-openrouter',
  ]);
  if (!validKeys.has(modelKey)) {
    return res.status(400).json({ error: `Unknown modelKey: "${modelKey}".` });
  }

  if (modelKey === 'custom-openrouter') {
    if (!customKey || !customModel) {
      return res.status(400).json({ error: 'Custom OpenRouter requires both customKey and customModel.' });
    }
  }

  // ── Prompt ───────────────────────────────────────────────────────────────
  const messages = buildPRDPrompt(transcript);

  // ── Route to provider ────────────────────────────────────────────────────
  try {
    const rawText = await routeToProvider(modelKey, messages, { customKey, customModel });
    const parsed = extractJSON(rawText);

    if (!parsed) {
      return res.status(502).json({ error: 'Model returned non-JSON output. Try again.' });
    }

    const output = normalizeOutput(parsed);
    return res.json(output);
  } catch (err) {
    // Safe error — never expose raw provider responses or keys
    console.error('Provider error:', err.message);
    if (err.message?.startsWith('Missing env var:')) {
      return res.status(400).json({ error: 'Selected provider is not available in this deployment. Choose another provider or contact the app owner.' });
    }
    return res.status(502).json({ error: 'AI provider request failed. Check server logs.' });
  }
}
