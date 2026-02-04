// routes/incidents.ts - Incidents API Routes
import { Router } from 'express';
import { IncidentModel } from '../models/incident';
import { WebsiteModel } from '../models/website';
import { Incident } from '../types';

const router = Router();

// GET /api/incidents - ดึงรายการ incidents ทั้งหมด
router.get('/', async (req, res) => {
  try {
    const incidents = IncidentModel.findAll();
    res.json({
      success: true,
      data: incidents,
      meta: {
        total: incidents.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/incidents/stats - สถิติ incidents
router.get('/stats', async (req, res) => {
  try {
    const stats = IncidentModel.getStats();
    const ongoing = IncidentModel.findOngoing();
    const resolved = IncidentModel.findResolved();
    
    // Calculate status distribution
    const statusDistribution = {
      up: resolved.filter((i) => i.status === 'up').length,
      down: resolved.filter((i) => i.status === 'down').length,
      unknown: resolved.filter((i) => i.status === 'unknown').length,
    };
    
    res.json({
      success: true,
      data: {
        ...stats,
        ongoingIncidents: ongoing.length,
        resolvedIncidents: resolved.length,
        statusDistribution,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/incidents/ongoing - ดึง incidents ที่ยังไม่ resolved
router.get('/ongoing', async (req, res) => {
  try {
    const incidents = IncidentModel.findOngoing();
    res.json({
      success: true,
      data: incidents,
      meta: {
        total: incidents.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/incidents/:id - ดึง incident ตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = IncidentModel.findById(id);
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }
    
    res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/incidents/:id/resolve -  resolve incident
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = IncidentModel.resolve(id);
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }
    
    res.json({
      success: true,
      data: incident,
      message: 'Incident resolved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
