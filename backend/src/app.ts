import express from 'express';
import cors from 'cors';
import { rolesRouter } from './routes/roles.routes';
import { profileRouter } from './routes/profile.routes';
import { analysisRouter } from './routes/analysis.routes';
import { tutorRouter } from './routes/tutor.routes';
import { skillsRouter } from './routes/skills.routes';
import { skillsAiRouter } from './routes/skills-ai.routes';
import { coursesRouter } from './routes/courses.routes';
import { postingsRouter } from './routes/postings.routes';
import { liveRouter } from './routes/live.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Phase 0 Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'skillbridge-api',
    version: '0.1.0'
  });
});

// Phase B Routes
app.use('/api/roles', rolesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/skills', skillsRouter);

// Phase C Routes
app.use('/api/tutor', tutorRouter);
app.use('/api/skills-ai', skillsAiRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/postings', postingsRouter);
app.use('/api/live', liveRouter);

// Global unhandled route catch
app.use((_req, res) => {
  res.status(404).json({ data: null, error: { message: 'Route not found' } });
});

export { app };
