import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { handleGenerate } from './generate.js';
import { handleProviderStatus } from './providerStatus.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy if the app is hosted behind a reverse proxy (e.g. Render, Railway)
app.set('trust proxy', 1);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Rate Limiter: Maksimal 5 request per jam untuk satu IP
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 5, // 5 requests
  message: { error: 'Batas penggunaan (5 kali/jam) tercapai. Silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.post('/api/generate', generateLimiter, handleGenerate);
} else {
  app.post('/api/generate', handleGenerate);
}

app.get('/api/providers/status', handleProviderStatus);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
