# AI Product Requirement & UI Generator

A full-stack web application that converts meeting transcripts into structured
product artifacts using Multi-LLM routing.

**Output:** PRD, User Stories, Functional Requirements, UI/UX Wireframes.

## Architecture

```
client/   React 18 + Vite + Tailwind CSS + Lucide React
  └─ POST /api/generate ──→  server/   Express + dotenv
                                ├─ Prompt builder (strict JSON)
                                ├─ Provider routing
                                └─ JSON extraction/normalization
```

The frontend never calls third-party LLM APIs directly except for the
optional Custom OpenRouter key/model sent per-request.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS 3, dark-mode-first |
| Icons | Lucide React |
| Backend runtime | Node.js 18+ |
| Web framework | Express 4 |
| Gemini SDK | @google/generative-ai |
| Other LLMs | native `fetch` (chat-completions / Messages) |

## Directory Structure

```
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── index.css
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js        # Express entrypoint
│       ├── generate.js     # Request handler, JSON extractor, normalizer
│       ├── llmRouter.js    # Provider routing
│       └── prompt.js       # Strict JSON prompt builder
├── docs/
│   └── internal/           # Private planning docs (gitignored)
├── .gitignore
└── README.md
```

## Backend Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in at least one provider key:

```bash
cp .env.example .env
```

```env
PORT=5000
MIMO_API_KEY=sk-...
MIMO_API_BASE_URL=https://api.mimo.com/v1
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

Only the key for the provider you intend to use must be set. The backend
validates at request time.

### 3. Start

```bash
npm start
```

Server listens on `http://localhost:5000`.

## Frontend Setup

```bash
cd client
npm install
npm run dev      # Dev server on http://localhost:5173
# or
npm run build    # Production build → client/dist/
```

## API Reference

### `GET /api/providers/status`

Returns safe provider configuration status for the frontend. API key values are never exposed.

```json
{
  "providers": {
    "openai": {
      "label": "OpenAI",
      "configured": false
    }
  },
  "models": {
    "openai-mini": {
      "provider": "openai",
      "configured": false
    }
  }
}
```

The frontend uses this endpoint to show inline warnings and disable Generate for server-side providers that are not configured.

### `POST /api/generate`

**Request**

```json
{
  "transcript": "We need a dashboard for support agents...",
  "modelKey": "gemini-flash",
  "customKey": "sk-or-...",
  "customModel": "anthropic/claude-3.5-sonnet"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `transcript` | **Yes** | Meeting transcript text |
| `modelKey` | **Yes** | See provider list below |
| `customKey` | Only for `custom-openrouter` | OpenRouter API key from frontend |
| `customModel` | Only for `custom-openrouter` | OpenRouter model ID |

**Success (200)**

```json
{
  "prd": "# Product Requirements Document\n...",
  "userStories": [
    {
      "id": "US-001",
      "asA": "support agent",
      "iWantTo": "view my assigned tickets",
      "soThatICan": "prioritize my daily work",
      "acceptanceCriteria": ["Tickets list is visible on login"]
    }
  ],
  "functionalRequirements": ["FR-01: The system shall..."],
  "uiUxWireframes": "<div class=\"card\"><h2>Dashboard</h2>...</div>"
}
```

**Errors**

| Status | Meaning |
| --- | --- |
| 400 | Missing `transcript`, unknown `modelKey`, or custom OpenRouter missing key/model |
| 502 | Provider API failure or model returned non-JSON output |

## Model / Provider Configuration

| `modelKey` | Provider | Model | Env Variable |
| --- | --- | --- | --- |
| `mimo-standard` | Xiaomi MiMo | `mimo-v2.5` | `MIMO_API_KEY` |
| `mimo-pro` | Xiaomi MiMo | `mimo-v2.5-pro` | `MIMO_API_KEY` |
| `openai-mini` | OpenAI | `gpt-4o-mini` | `OPENAI_API_KEY` |
| `openai-pro` | OpenAI | `gpt-4o` | `OPENAI_API_KEY` |
| `claude-haiku` | Anthropic | `claude-3-5-haiku-latest` | `CLAUDE_API_KEY` |
| `claude-sonnet` | Anthropic | `claude-3-5-sonnet-latest` | `CLAUDE_API_KEY` |
| `gemini-flash` | Google Gemini | `gemini-2.5-flash` | `GEMINI_API_KEY` |
| `gemini-pro` | Google Gemini | `gemini-2.5-pro` | `GEMINI_API_KEY` |
| `custom-openrouter` | OpenRouter | User-defined (frontend) | User-defined (frontend) |

### Provider Notes

- **MiMo**: The base URL is configurable via `MIMO_API_BASE_URL` because
  Xiaomi API endpoints may vary. Uses standard chat-completions format.
- **OpenAI**: ChatGPT-style `/v1/chat/completions`. `gpt-4o-mini` also
  sends `response_format: { type: "json_object" }` for structured output.
- **Claude**: Uses Anthropic Messages API (`/v1/messages`) with system
  prompt extracted from the messages array.
- **Gemini**: Uses the `@google/generative-ai` SDK.
- **Custom OpenRouter**: Key and model ID are sent from the frontend per
  request. Both values are persisted to `localStorage` in the browser.

## Local Development

1. Start backend: `cd server && npm start`
2. Start frontend: `cd client && npm run dev`
3. Open `http://localhost:5173` in a browser.
4. Paste a transcript, select a provider, and click **Generate**.

## Production Deployment

### 1. Backend (VPS / Docker Compose)
- The backend is fully containerized and configured for VPS environments.
- Refer to the private deployment guide in `docs/internal/01-architecture/20260603_hermes-deployment-handoff.md` for production VPS details (Nginx reverse proxy, Docker Compose, and Let's Encrypt SSL integration).
- **Nginx Timeout**: Ensure Nginx `proxy_read_timeout`, `proxy_connect_timeout`, and `proxy_send_timeout` are set to at least `300s` to allow complex LLM generation calls to finish without proxy timeouts.
- The container binds to localhost port `5000` (mapped via Docker Compose) to keep the port hidden from public internet exposure.

### 2. Frontend (Vercel)
- Deploy static build (`client/dist/`) to Vercel or any static host.
- Set the environment variable `VITE_API_BASE_URL` (e.g. `https://api-prd-aigen.ruangsya.my.id`) in the hosting provider's dashboard.

## Assumptions

- Node.js 18+ is required (for native `fetch` support).
- Users must bring their own API keys for any provider they use.
- The app processes one transcript at a time; no history persistence.
- Wireframes are generated as Semantic HTML and rendered visually using PaperCSS.
- Rate limiting is automatically enabled in production (5 requests/hour per IP) to prevent token abuse.

## Limitations

- No persistent storage — results are lost on page refresh.
- LLM output quality varies by provider and model.
- JSON extraction is best-effort; some models may fail to produce valid JSON.
- Only single-turn processing — no multi-step refinement.
- No real-time streaming of responses.
- **Cloudflare 100s Timeout**: The Cloudflare Free Plan enforces a strict 100-second HTTP response timeout. Heavy or slow models (such as Gemini 2.5 Pro or Claude 3.5 Sonnet) may occasionally exceed this limit and trigger a `504 Gateway Timeout` at the Cloudflare Edge, even if the backend is configured correctly. For production under Cloudflare Free, it is highly recommended to use fast models (like Gemini 2.5 Flash) or bypass Cloudflare's HTTP proxy (using DNS-only mode) if long-running model generations are required.

## Future Improvements

- **Persistent Storage**: Save generated PRDs and wireframes to a database (e.g., MongoDB, PostgreSQL) with user accounts.
- **Interactive Refinement**: Allow users to chat with the LLM to refine the generated artifacts (multi-turn conversations).
- **Exporting Options**: Download PRDs as PDF or Markdown and export HTML wireframes to custom styling templates.
- **Real-Time Streaming**: Stream the LLM response chunk-by-chunk to improve perceived response times.

## Documentation

- **Internal Planning**: Private planning, design docs, and server deployment notes live in `docs/internal/` and are excluded from version control via `.gitignore`.
- **Public Guides**: User guides, such as the [Sample Transcripts](file:///D:/Luar/AI%20Product%20Requirement%20&%20UI%20Generator/docs/public/01-guide/20260603_sample-transcripts.md), live in `docs/public/01-guide/`.

