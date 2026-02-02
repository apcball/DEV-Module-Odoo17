// app.ts - Express App Configuration
import express from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard';
import incidentsRoutes from './routes/incidents';
import websitesRoutes from './routes/websites';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'atlas-monitor-backend',
  });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/websites', websitesRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

export default app;
