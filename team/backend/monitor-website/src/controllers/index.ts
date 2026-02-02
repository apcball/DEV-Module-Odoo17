import { Request, Response } from 'express';
import websiteModel from '../models/website';
import incidentModel from '../models/incident';
import { checkWebsite } from '../services/monitor';
import { CreateWebsiteDTO, UpdateWebsiteDTO } from '../types';

// ============================================
// Website Controllers
// ============================================

// GET /api/websites - Get all websites
export async function getAllWebsites(req: Request, res: Response): Promise<void> {
  try {
    const websites = await websiteModel.getAllWebsites();
    res.json({ success: true, data: websites });
  } catch (error) {
    console.error('Error getting websites:', error);
    res.status(500).json({ success: false, error: 'Failed to get websites' });
  }
}

// GET /api/websites/:id - Get website by ID
export async function getWebsiteById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const website = await websiteModel.getWebsiteById(id);
    
    if (!website) {
      res.status(404).json({ success: false, error: 'Website not found' });
      return;
    }
    
    res.json({ success: true, data: website });
  } catch (error) {
    console.error('Error getting website:', error);
    res.status(500).json({ success: false, error: 'Failed to get website' });
  }
}

// POST /api/websites - Create new website
export async function createWebsite(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateWebsiteDTO = req.body;
    
    // Validation
    if (!data.name || !data.url) {
      res.status(400).json({ success: false, error: 'Name and URL are required' });
      return;
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(data.url)) {
      res.status(400).json({ success: false, error: 'Invalid URL format. Must start with http:// or https://' });
      return;
    }
    
    const website = await websiteModel.createWebsite(data);
    res.status(201).json({ success: true, data: website, message: 'Website created successfully' });
  } catch (error) {
    console.error('Error creating website:', error);
    // Check for maximum limit error
    if (error instanceof Error && error.message === 'Maximum 10 websites allowed') {
      res.status(400).json({ success: false, error: 'Maximum 10 websites allowed' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create website' });
  }
}

// PUT /api/websites/:id - Update website
export async function updateWebsite(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateWebsiteDTO = req.body;
    
    const website = await websiteModel.updateWebsite(id, data);
    
    if (!website) {
      res.status(404).json({ success: false, error: 'Website not found' });
      return;
    }
    
    res.json({ success: true, data: website, message: 'Website updated successfully' });
  } catch (error) {
    console.error('Error updating website:', error);
    res.status(500).json({ success: false, error: 'Failed to update website' });
  }
}

// DELETE /api/websites/:id - Delete website
export async function deleteWebsite(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const deleted = await websiteModel.deleteWebsite(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Website not found' });
      return;
    }
    
    res.json({ success: true, message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Error deleting website:', error);
    res.status(500).json({ success: false, error: 'Failed to delete website' });
  }
}

// POST /api/check/:id - Manual check website
export async function checkWebsiteManual(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const website = await websiteModel.getWebsiteById(id);
    
    if (!website) {
      res.status(404).json({ success: false, error: 'Website not found' });
      return;
    }
    
    const result = await checkWebsite(website, 'manual');
    res.json({ success: true, data: result, message: 'Website checked successfully' });
  } catch (error) {
    console.error('Error checking website:', error);
    res.status(500).json({ success: false, error: 'Failed to check website' });
  }
}

// ============================================
// Dashboard Controllers
// ============================================

// GET /api/dashboard - Get dashboard data (legacy)
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const [websiteSummary, incidentStats, websites, recentIncidents, recentLogs] = await Promise.all([
      websiteModel.getWebsitesSummary(),
      incidentModel.getIncidentStats(),
      websiteModel.getAllWebsites(),
      incidentModel.getRecentIncidents(5),
      incidentModel.getRecentLogs(20),
    ]);

    // Calculate overall uptime
    const totalUptime = websites.reduce((sum, w) => sum + parseFloat(w.uptime_percentage || 0), 0);
    const avgUptime = websites.length > 0 ? totalUptime / websites.length : 100;
    
    // Calculate average response time
    const responseTimes = websites
      .filter(w => w.last_response_time_ms)
      .map(w => w.last_response_time_ms);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const dashboardData = {
      stats: {
        totalWebsites: parseInt(websiteSummary.total),
        onlineCount: parseInt(websiteSummary.online),
        warningCount: parseInt(websiteSummary.warning),
        offlineCount: parseInt(websiteSummary.offline),
        overallUptime: parseFloat(avgUptime.toFixed(2)),
        activeIncidents: parseInt(incidentStats.ongoing),
        incidents24h: parseInt(incidentStats.total24h),
        avgResponseTime: Math.round(avgResponseTime),
      },
      websites: websites.map(w => ({
        id: w.id,
        name: w.name,
        url: w.url,
        current_status: w.current_status,
        last_check_at: w.last_check_at,
        last_response_time_ms: w.last_response_time_ms,
        uptime_percentage: parseFloat(w.uptime_percentage),
      })),
      recentIncidents,
      recentLogs,
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard data' });
  }
}

// GET /api/dashboard/stats - Get dashboard stats (for Frontend)
export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const [websiteSummary, incidentStats, websites] = await Promise.all([
      websiteModel.getWebsitesSummary(),
      incidentModel.getIncidentStats(),
      websiteModel.getAllWebsites(),
    ]);

    // Calculate overall uptime
    const totalUptime = websites.reduce((sum, w) => sum + parseFloat(w.uptime_percentage || 0), 0);
    const avgUptime = websites.length > 0 ? totalUptime / websites.length : 100;
    
    // Calculate average response time
    const responseTimes = websites
      .filter(w => w.last_response_time_ms)
      .map(w => w.last_response_time_ms);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const stats = {
      totalWebsites: parseInt(websiteSummary.total),
      onlineCount: parseInt(websiteSummary.online),
      warningCount: parseInt(websiteSummary.warning),
      offlineCount: parseInt(websiteSummary.offline),
      overallUptime: parseFloat(avgUptime.toFixed(2)),
      activeIncidents: parseInt(incidentStats.ongoing),
      incidents24h: parseInt(incidentStats.total24h),
      avgResponseTime: Math.round(avgResponseTime),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard stats' });
  }
}

// GET /api/dashboard/uptime - Get uptime chart data (for Frontend)
export async function getDashboardUptime(req: Request, res: Response): Promise<void> {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const websiteId = req.query.websiteId ? parseInt(req.query.websiteId as string) : undefined;
    
    const uptimeData = await incidentModel.getUptimeChartData(hours, websiteId);

    res.json({ success: true, data: uptimeData });
  } catch (error) {
    console.error('Error getting uptime data:', error);
    res.status(500).json({ success: false, error: 'Failed to get uptime data' });
  }
}

// GET /api/dashboard/incidents - Get recent incidents (for Frontend)
export async function getDashboardIncidents(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const incidents = await incidentModel.getRecentIncidents(limit);

    res.json({ success: true, data: incidents });
  } catch (error) {
    console.error('Error getting dashboard incidents:', error);
    res.status(500).json({ success: false, error: 'Failed to get incidents' });
  }
}

// ============================================
// Incident Controllers
// ============================================

// GET /api/incidents - Get all incidents
export async function getIncidents(req: Request, res: Response): Promise<void> {
  try {
    const params = {
      websiteId: req.query.websiteId ? parseInt(req.query.websiteId as string) : undefined,
      status: req.query.status as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    
    const incidents = await incidentModel.getIncidents(params);
    res.json({ success: true, data: incidents });
  } catch (error) {
    console.error('Error getting incidents:', error);
    res.status(500).json({ success: false, error: 'Failed to get incidents' });
  }
}

// GET /api/incidents/:id - Get incident by ID
export async function getIncidentById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const incident = await incidentModel.getIncidentById(id);
    
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }
    
    res.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error getting incident:', error);
    res.status(500).json({ success: false, error: 'Failed to get incident' });
  }
}

// PUT /api/incidents/:id/acknowledge - Acknowledge incident
export async function acknowledgeIncident(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const incident = await incidentModel.acknowledgeIncident(id);
    
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }
    
    res.json({ success: true, data: incident, message: 'Incident acknowledged' });
  } catch (error) {
    console.error('Error acknowledging incident:', error);
    res.status(500).json({ success: false, error: 'Failed to acknowledge incident' });
  }
}

// GET /api/logs - Get check logs
export async function getCheckLogs(req: Request, res: Response): Promise<void> {
  try {
    const params = {
      websiteId: req.query.websiteId ? parseInt(req.query.websiteId as string) : undefined,
      status: req.query.status as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    
    const logs = await incidentModel.getCheckLogs(params);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get logs' });
  }
}