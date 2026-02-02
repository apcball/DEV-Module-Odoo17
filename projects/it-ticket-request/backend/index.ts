// index.ts - Server Entry Point
import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Atlas Monitor Backend running on port ${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   GET  /health                    - Health check`);
  console.log(`   GET  /api/dashboard/response-time - Response time chart data`);
  console.log(`   GET  /api/dashboard/summary     - Dashboard summary`);
  console.log(`   GET  /api/incidents             - List all incidents`);
  console.log(`   GET  /api/incidents/stats       - Incident statistics`);
  console.log(`   GET  /api/incidents/ongoing     - Ongoing incidents`);
  console.log(`   GET  /api/websites              - List all websites`);
  console.log(`   GET  /api/websites/:id          - Get website by ID`);
  console.log(`   GET  /api/websites/:id/uptime   - Get website uptime data`);
});
