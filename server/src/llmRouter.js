import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Provider Map ───────────────────────────────────────────────────────────

const PROVIDERS = {
  'mimo-standard': {
    provider: 'mimo',
    model: 'mimo-v2.5',
    envKey: 'MIMO_API_KEY',
  },
  'mimo-pro': {
    provider: 'mimo',
    model: 'mimo-v2.5-pro',
    envKey: 'MIMO_API_KEY',
  },
  'openai-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
  },
  'openai-pro': {
    provider: 'openai',
    model: 'gpt-4o',
    envKey: 'OPENAI_API_KEY',
  },
  'claude-haiku': {
    provider: 'claude',
    model: 'claude-3-5-haiku-latest',
    envKey: 'CLAUDE_API_KEY',
  },
  'claude-sonnet': {
    provider: 'claude',
    model: 'claude-3-5-sonnet-latest',
    envKey: 'CLAUDE_API_KEY',
  },
  'gemini-flash': {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    envKey: 'GEMINI_API_KEY',
  },
  'gemini-pro': {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    envKey: 'GEMINI_API_KEY',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function textContent(messages) {
  // For providers that don't support system role natively,
  // merge system into the first user message.
  const system = messages.find(m => m.role === 'system');
  const rest = messages.filter(m => m.role !== 'system');
  if (system) {
    if (rest.length && rest[0].role === 'user') {
      rest[0] = { ...rest[0], content: `${system.content}\n\n${rest[0].content}` };
    } else {
      rest.unshift({ role: 'user', content: system.content });
    }
  }
  return rest;
}

// ─── Provider Callers ───────────────────────────────────────────────────────

async function callOpenAI(format, model, apiKey, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, ...(format ? { response_format: format } : {}) }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices[0].message.content;
}

async function callMiMo(model, apiKey, messages) {
  const base = process.env.MIMO_API_BASE_URL;
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: textContent(messages),
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`MiMo ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices[0].message.content;
}

async function callClaude(model, apiKey, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: messages.find(m => m.role === 'system')?.content,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: 'user',
        content: Array.isArray(m.content)
          ? m.content
          : [{ type: 'text', text: m.content }],
      })),
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.content[0].text;
}

async function callGemini(model, apiKey, messages) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const system = messages.find(m => m.role === 'system')?.content;
  const userText = messages
    .filter(m => m.role !== 'system')
    .map(m => m.content)
    .join('\n\n');

  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: system,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const result = await geminiModel.generateContent(userText);
  return result.response.text();
}

async function callOpenRouter(model, apiKey, messages) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices[0].message.content;
}

// ─── Main Router ────────────────────────────────────────────────────────────

/**
 * @param {string} modelKey - e.g. "openai-mini", "custom-openrouter"
 * @param {Array} messages - [{ role, content }]
 * @param {{ customKey, customModel }} opts
 * @returns {Promise<string>} raw text response
 */
export async function routeToProvider(modelKey, messages, { customKey, customModel } = {}) {
  if (modelKey === 'custom-openrouter') {
    if (!customKey || !customModel) {
      throw new Error('customKey and customModel required for OpenRouter');
    }
    return callOpenRouter(customModel, customKey, messages);
  }

  const cfg = PROVIDERS[modelKey];
  if (!cfg) throw new Error(`Unknown model key: ${modelKey}`);

  const apiKey = process.env[cfg.envKey];
  if (!apiKey) throw new Error(`Missing env var: ${cfg.envKey}`);

  switch (cfg.provider) {
    case 'openai':
      return callOpenAI(
        cfg.model === 'gpt-4o-mini' ? { type: 'json_object' } : null,
        cfg.model,
        apiKey,
        messages
      );
    case 'mimo':
      return callMiMo(cfg.model, apiKey, messages);
    case 'claude':
      return callClaude(cfg.model, apiKey, messages);
    case 'gemini':
      return callGemini(cfg.model, apiKey, messages);
    default:
      throw new Error(`Unsupported provider: ${cfg.provider}`);
  }
}
