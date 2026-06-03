import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  FileText, Users, CheckSquare, Layout, Send, Upload, X,
  AlertCircle, Loader2, Sparkles, ChevronDown, Copy, Check,
} from 'lucide-react';

// ─── localStorage helpers ──────────────────────────────────────────────────

const LS_KEYS = { customKey: 'or_customKey', customModel: 'or_customModel' };

function loadLS(key) {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, val); } catch { /* noop */ }
}

// ─── Provider model config ─────────────────────────────────────────────────

const PROVIDER_GROUPS = [
  {
    label: 'Xiaomi MiMo',
    models: [
      { key: 'mimo-standard', label: 'MiMo Standard (v2.5)' },
      { key: 'mimo-pro', label: 'MiMo Pro (v2.5)' },
    ],
  },
  {
    label: 'OpenAI',
    models: [
      { key: 'openai-mini', label: 'GPT-4o Mini' },
      { key: 'openai-pro', label: 'GPT-4o' },
    ],
  },
  {
    label: 'Anthropic Claude',
    models: [
      { key: 'claude-haiku', label: 'Claude 3.5 Haiku' },
      { key: 'claude-sonnet', label: 'Claude 3.5 Sonnet' },
    ],
  },
  {
    label: 'Google Gemini',
    models: [
      { key: 'gemini-flash', label: 'Gemini 2.5 Flash' },
      { key: 'gemini-pro', label: 'Gemini 2.5 Pro' },
    ],
  },
  {
    label: 'Custom',
    models: [
      { key: 'custom-openrouter', label: 'Custom OpenRouter' },
    ],
  },
];

const TABS = [
  { key: 'prd', label: 'PRD', icon: FileText },
  { key: 'userStories', label: 'User Stories', icon: Users },
  { key: 'functionalRequirements', label: 'Requirements', icon: CheckSquare },
  { key: 'uiUxWireframes', label: 'Wireframes', icon: Layout },
];

const FIELD_CLASS = 'w-full rounded-2xl border border-white/10 bg-canvas-900/80 px-4 py-3 text-sm text-stone-100 outline-none shadow-inner shadow-black/20 transition-colors placeholder:text-stone-500 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20';
const LABEL_CLASS = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400';

function getModelLabel(modelKey) {
  for (const group of PROVIDER_GROUPS) {
    const model = group.models.find((item) => item.key === modelKey);
    if (model) return `${group.label} / ${model.label}`;
  }
  return modelKey;
}

// ─── Tab Components ─────────────────────────────────────────────────────────

function PrdTab({ content }) {
  if (!content) return <EmptyState icon={FileText} text="No PRD yet" />;
  return (
    <article className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-[#f0eadf] px-6 py-7 text-[#211c18] shadow-editorial sm:px-9">
      <div className="mb-5 flex items-center justify-between border-b border-canvas-950/10 pb-3">
        <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Product brief</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-canvas-700/60">Generated artifact</span>
      </div>
      <div className="whitespace-pre-wrap font-body text-[15px] leading-7 text-[#211c18]">
        {content}
      </div>
    </article>
  );
}

function StoriesTab({ stories }) {
  if (!stories?.length) return <EmptyState icon={Users} text="No user stories yet" />;
  return (
    <div className="space-y-3">
      {stories.map((s) => (
        <div key={s.id} className="rounded-2xl border border-white/10 bg-canvas-900/85 p-5 shadow-editorial transition-colors hover:border-brand-500/35">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-brand-500 px-3 py-1 font-mono text-[11px] font-bold text-white shadow-glow">
              {s.id}
            </span>
            <span className="font-display text-sm font-bold text-stone-100">{s.asA ? `As a ${s.asA}` : ''}</span>
          </div>
          <div className="ml-1 space-y-1.5 text-sm leading-6 text-stone-300">
            {s.iWantTo && <p><span className="text-slate-500">I want to:</span> {s.iWantTo}</p>}
            {s.soThatICan && <p><span className="text-slate-500">So that:</span> {s.soThatICan}</p>}
          </div>
          {s.acceptanceCriteria?.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyanfire-300">Acceptance Criteria</p>
              <ul className="space-y-1">
                {s.acceptanceCriteria.map((ac, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-5 text-stone-300">
                    <span className="mt-0.5 text-brand-400">•</span>
                    <span>{ac}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReqsTab({ items }) {
  if (!items?.length) return <EmptyState icon={CheckSquare} text="No requirements yet" />;
  return (
    <ul className="space-y-2">
      {items.map((r, i) => (
        <li key={i} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-canvas-900/80 p-4 text-sm leading-6 text-stone-200 shadow-black/20">
          <span className="mt-0.5 shrink-0 rounded-full border border-cyanfire-400/40 px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-cyanfire-300">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span>{r}</span>
        </li>
      ))}
    </ul>
  );
}

function cleanWireframeSource(content) {
  return content
    .replace(/```(?:html|xml)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-canvas-800/90 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-stone-300 transition-transform hover:border-brand-500/70 hover:text-brand-300 active:scale-[0.96]"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function PaperCSSPreview({ source }) {
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/papercss@1.9.2/dist/paper.min.css">
        <style>
          body { padding: 1.5rem; background: #fff; }
          .paper-preview-container { max-width: 100%; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="paper-preview-container">
          ${source}
        </div>
      </body>
    </html>
  `;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-cyanfire-400/20 bg-canvas-950/95 shadow-editorial ring-1 ring-white/5">
      <iframe
        srcDoc={srcDoc}
        title="Wireframe Preview"
        sandbox="allow-scripts"
        className="h-[600px] w-full border-0 bg-white"
      />
    </div>
  );
}

function WireframeTab({ content }) {
  const source = useMemo(() => cleanWireframeSource(content || ''), [content]);
  if (!source) return <EmptyState icon={Layout} text="No wireframes yet" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-500">Wireframe preview</p>
          <h3 className="font-display text-xl font-semibold tracking-tight text-[#211c18]">
            Live artifact canvas
          </h3>
          <p className="text-xs text-canvas-700/70">
            Rendered as a sketchy low-fidelity wireframe via PaperCSS.
          </p>
        </div>
        <CopyButton value={source} label="Copy HTML" />
      </div>

      <PaperCSSPreview source={source} />

      <div className="rounded-[1.75rem] border border-white/10 bg-canvas-950/80 shadow-editorial">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Semantic HTML Source</span>
          <CopyButton value={source} label="Copy source" />
        </div>
        <pre className="max-h-[42vh] overflow-auto p-4 font-mono text-xs text-stone-300 whitespace-pre-wrap">
          {source}
        </pre>
      </div>
    </div>
  );
}

function ProviderNotice({ modelLabel, status, statusError }) {
  if (status?.configured === false) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <p className="font-semibold text-amber-100">Provider belum tersedia</p>
            <p className="mt-1 text-xs leading-5 text-amber-100/75">
              {modelLabel} belum diaktifkan pada deployment ini. Pilih provider lain yang tersedia atau hubungi pengelola aplikasi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="rounded-2xl border border-cyanfire-400/25 bg-cyanfire-400/10 p-4 text-xs leading-5 text-cyanfire-300">
        Provider status tidak bisa dibaca dari backend. Generate tetap diizinkan, tapi error provider mungkin muncul jika API key belum tersedia.
      </div>
    );
  }

  return null;
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-canvas-900/40 py-16 text-stone-600">
      <Icon className="mb-3 h-10 w-10 text-brand-400 opacity-50" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [modelKey, setModelKey] = useState('gemini-flash');
  const [customKey, setCustomKey] = useState(() => loadLS(LS_KEYS.customKey));
  const [customModel, setCustomModel] = useState(() => loadLS(LS_KEYS.customModel));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('prd');
  const [providerStatus, setProviderStatus] = useState(null);
  const [providerStatusError, setProviderStatusError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProviderStatus() {
      try {
        const res = await fetch(`${API_BASE}/api/providers/status`);
        if (!res.ok) throw new Error(`Status request failed (${res.status})`);
        const data = await res.json();
        if (!cancelled) {
          setProviderStatus(data);
          setProviderStatusError('');
        }
      } catch (err) {
        if (!cancelled) setProviderStatusError(err.message || 'Unable to load provider status');
      }
    }

    loadProviderStatus();
    return () => { cancelled = true; };
  }, []);

  const isOpenRouter = modelKey === 'custom-openrouter';
  const selectedModelStatus = providerStatus?.models?.[modelKey];
  const providerNotConfigured = selectedModelStatus?.configured === false;
  const canGenerate = transcript.trim().length > 0
    && !providerNotConfigured
    && (!isOpenRouter || (customKey.trim().length > 0 && customModel.trim().length > 0));

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setTranscript(ev.target.result || '');
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleCustomKey = useCallback((val) => {
    setCustomKey(val);
    saveLS(LS_KEYS.customKey, val);
  }, []);
  const handleCustomModel = useCallback((val) => {
    setCustomModel(val);
    saveLS(LS_KEYS.customModel, val);
  }, []);

  const handleGenerate = useCallback(async () => {
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const body = { transcript: transcript.trim(), modelKey };
      if (isOpenRouter) {
        body.customKey = customKey.trim();
        body.customModel = customModel.trim();
      }
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data);
      setActiveTab('prd');
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [transcript, modelKey, isOpenRouter, customKey, customModel]);

  // ── Derived active tab content ──────────────────────────────────────────
  const tabContent = {
    prd: <PrdTab content={result?.prd} />,
    userStories: <StoriesTab stories={result?.userStories} />,
    functionalRequirements: <ReqsTab items={result?.functionalRequirements} />,
    uiUxWireframes: <WireframeTab content={result?.uiUxWireframes} />,
  };

  const currentModelLabel = getModelLabel(modelKey);

  return (
    <div className="relative min-h-screen overflow-hidden font-body text-stone-100">
      <div className="pointer-events-none absolute inset-x-6 top-6 h-40 rounded-full bg-brand-500/10 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-canvas-950/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
              <Sparkles className="h-4 w-4" /> Product War Room
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.035em] text-stone-100 sm:text-4xl">
              PRD/UI Command Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-400">
              Turn messy meetings into structured product artifacts: PRDs, stories, requirements, and live wireframes.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right shadow-editorial">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Active engine</p>
            <p className="mt-1 text-sm font-bold text-cyanfire-300">{currentModelLabel}</p>
          </div>
        </div>
      </header>

      {/* Two-Column Body */}
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-150px)] w-full max-w-[1500px] gap-5 p-5 lg:grid-cols-[430px_minmax(0,1fr)] lg:p-8">
        {/* LEFT PANEL */}
        <section className="flex min-h-0 flex-col gap-5 rounded-[2rem] border border-white/10 bg-canvas-950/80 p-5 shadow-editorial ring-1 ring-white/5">
          <div className="border-b border-white/10 pb-4">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">01 / Input Brief</p>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-stone-100">Engine console</h2>
            <p className="mt-1 text-xs leading-5 text-stone-500">Choose an LLM, paste meeting context, then generate product artifacts.</p>
          </div>

          {/* Provider Select */}
          <div>
            <label className={LABEL_CLASS}>Provider Engine</label>
            <div className="relative">
              <select
                value={modelKey}
                onChange={(e) => { setModelKey(e.target.value); setError(''); }}
                className={`${FIELD_CLASS} appearance-none pr-10 font-bold`}
              >
                {PROVIDER_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.models.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            </div>
          </div>

          <ProviderNotice
            modelLabel={currentModelLabel}
            status={selectedModelStatus}
            statusError={providerStatusError && !providerStatus ? providerStatusError : ''}
          />

          {/* Custom OpenRouter fields */}
          {isOpenRouter && (
            <div className="space-y-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 shadow-glow">
              <div>
                <label className={LABEL_CLASS}>OpenRouter API Key</label>
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => handleCustomKey(e.target.value)}
                  placeholder="sk-or-..."
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Model ID</label>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => handleCustomModel(e.target.value)}
                  placeholder="e.g. anthropic/claude-3.5-sonnet"
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className={LABEL_CLASS}>Meeting Transcript</label>
              <div className="flex items-center gap-2">
                <label className="flex min-h-10 cursor-pointer items-center gap-1 rounded-full px-2 text-xs font-bold text-stone-500 transition-colors hover:text-cyanfire-300">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .txt</span>
                  <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} className="hidden" />
                </label>
                {transcript && (
                  <button
                    onClick={() => setTranscript('')}
                    className="flex min-h-10 items-center gap-0.5 rounded-full px-2 text-xs font-bold text-stone-500 transition-colors hover:text-brand-300 active:scale-[0.96]"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => { setTranscript(e.target.value); setError(''); }}
              placeholder="Paste your product discovery meeting transcript here..."
              className={`${FIELD_CLASS} min-h-[260px] flex-1 resize-none leading-6`}
            />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-600">{transcript.length} characters captured</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-white shadow-glow transition-transform hover:bg-brand-400 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand-500"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </section>

        {/* RIGHT PANEL — Tabs + Content */}
        <section className="flex min-h-0 flex-col rounded-[2rem] border border-white/10 bg-[#ebe4d8]/95 p-5 text-[#211c18] shadow-editorial ring-1 ring-white/20">
          <div className="mb-5 flex flex-col gap-2 border-b border-canvas-950/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Artifact Canvas</p>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] text-[#211c18]">Structured product output</h2>
            </div>
            <p className="max-w-sm text-xs leading-5 text-canvas-700/70">Review every generated artifact in one editorial workspace, then copy or refine what you need.</p>
          </div>

          {/* Tabs */}
          <nav className="mb-5 flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-transform active:scale-[0.96]
                    ${active
                      ? 'border-canvas-950 bg-canvas-950 text-stone-100 shadow-editorial'
                      : 'border-canvas-950/10 bg-white text-canvas-700 hover:border-brand-500/60 hover:text-brand-600'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-auto rounded-[1.5rem] bg-[#f6f0e6]/60 p-4 shadow-inner shadow-canvas-950/5">
            {result ? (
              tabContent[activeTab]
            ) : (
              <div className="flex min-h-[52vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-canvas-950/15 bg-[#f7f1e8]/70 px-6 py-24 text-center text-canvas-700">
                <Sparkles className="mb-5 h-14 w-14 text-brand-500 opacity-80" />
                <p className="font-display text-2xl font-semibold tracking-[-0.015em] text-[#211c18]">Awaiting source material</p>
                <p className="mt-2 max-w-md text-sm text-canvas-700/70">Enter a transcript, choose an engine, and generate your product command packet.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
