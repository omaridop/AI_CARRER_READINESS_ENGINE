import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'skillbridge-api',
    version: '0.1.0',
    message: 'Phase 0 — Scaffolding complete. No features implemented yet.',
  });
});

app.listen(PORT, () => {
  console.log(`SkillBridge API running on http://localhost:${PORT}`);
});
