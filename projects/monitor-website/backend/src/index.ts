import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { startAllJobs, stopAllJobs } from './services/cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Middleware
// ============================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// Routes
// ============================================

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'monitor-website-backend'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Monitor Website Backend API',
    version: '1.0.0',
    endpoints: {
      websites: '/api/websites',
      dashboard: '/api/dashboard',
      incidents: '/api/incidents',
      logs: '/api/logs',
      check: '/api/check/:id',
    },
    health: '/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ============================================
// Server Startup
// ============================================

const server = app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     🚀 Monitor Website Backend API v1.0.0         ║');
  console.log('║     Created by: Atlas (The Squad)                 ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  Server running on port ${PORT}                    ║`);
  console.log(`║  API URL: http://localhost:${PORT}/api            ║`);
  console.log('╚════════════════════════════════════════════════════╝');
  
  // Start cron jobs
  startAllJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  stopAllJobs();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  stopAllJobs();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;