import { Router } from 'express';
import {
  getAllWebsites,
  getWebsiteById,
  createWebsite,
  updateWebsite,
  deleteWebsite,
  checkWebsiteManual,
  getDashboard,
  getDashboardStats,
  getDashboardUptime,
  getDashboardIncidents,
  getIncidents,
  getIncidentById,
  acknowledgeIncident,
  getCheckLogs,
} from '../controllers';

const router = Router();

// ============================================
// Website Routes
// ============================================

// GET /api/websites - Get all websites
router.get('/websites', getAllWebsites);

// GET /api/websites/:id - Get website by ID
router.get('/websites/:id', getWebsiteById);

// POST /api/websites - Create new website
router.post('/websites', createWebsite);

// PUT /api/websites/:id - Update website
router.put('/websites/:id', updateWebsite);

// DELETE /api/websites/:id - Delete website
router.delete('/websites/:id', deleteWebsite);

// ============================================
// Dashboard Routes (Frontend API)
// ============================================

// GET /api/dashboard - Get dashboard data (legacy)
router.get('/dashboard', getDashboard);

// GET /api/dashboard/stats - Get dashboard stats overview
router.get('/dashboard/stats', getDashboardStats);

// GET /api/dashboard/uptime - Get uptime chart data
router.get('/dashboard/uptime', getDashboardUptime);

// GET /api/dashboard/incidents - Get recent incidents
router.get('/dashboard/incidents', getDashboardIncidents);

// ============================================
// Check Routes
// ============================================

// POST /api/check/:id - Manual check website
router.post('/check/:id', checkWebsiteManual);

// ============================================
// Incident Routes
// ============================================

// GET /api/incidents - Get all incidents
router.get('/incidents', getIncidents);

// GET /api/incidents/:id - Get incident by ID
router.get('/incidents/:id', getIncidentById);

// PUT /api/incidents/:id/acknowledge - Acknowledge incident
router.put('/incidents/:id/acknowledge', acknowledgeIncident);

// ============================================
// Log Routes
// ============================================

// GET /api/logs - Get check logs
router.get('/logs', getCheckLogs);

export default router;