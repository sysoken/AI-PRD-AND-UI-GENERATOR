function hasValue(name) {
  const value = process.env[name];
  return Boolean(value && value.trim() && !value.trim().toLowerCase().startsWith('your_'));
}

function providerStatus(label, requiredEnv) {
  const configured = requiredEnv.every((name) => hasValue(name));
  return {
    label,
    configured,
  };
}

const MODEL_PROVIDER = {
  'mimo-standard': 'mimo',
  'mimo-pro': 'mimo',
  'openai-mini': 'openai',
  'openai-pro': 'openai',
  'claude-haiku': 'claude',
  'claude-sonnet': 'claude',
  'gemini-flash': 'gemini',
  'gemini-pro': 'gemini',
  'custom-openrouter': 'custom-openrouter',
};

export function getProviderStatus() {
  const providers = {
    mimo: providerStatus('Xiaomi MiMo', ['MIMO_API_KEY', 'MIMO_API_BASE_URL']),
    openai: providerStatus('OpenAI', ['OPENAI_API_KEY']),
    claude: providerStatus('Anthropic Claude', ['CLAUDE_API_KEY']),
    gemini: providerStatus('Google Gemini', ['GEMINI_API_KEY']),
    'custom-openrouter': {
      label: 'Custom OpenRouter',
      configured: 'client-side',
    },
  };

  const models = Object.fromEntries(
    Object.entries(MODEL_PROVIDER).map(([modelKey, provider]) => [
      modelKey,
      {
        provider,
        configured: providers[provider].configured,
      },
    ])
  );

  return { providers, models };
}

export function handleProviderStatus(_req, res) {
  res.json(getProviderStatus());
}
