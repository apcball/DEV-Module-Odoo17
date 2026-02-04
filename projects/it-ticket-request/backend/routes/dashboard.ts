// routes/dashboard.ts - Dashboard API Routes
import { Router } from 'express';
import { MonitorService } from '../services/monitor';
import { WebsiteModel } from '../models/website';
import { DashboardResponseTime } from '../types';

const router = Router();

// GET /api/dashboard/response-time - ข้อมูล response time chart
router.get('/response-time', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const websites = WebsiteModel.findAll();
    
    const responseTimeData: DashboardResponseTime[] = await Promise.all(
      websites.map(async (website) => {
        const data = await MonitorService.getResponseTimeHistory(website.id, hours);
        return {
          websiteId: website.id,
          websiteName: website.name,
          data,
        };
      })
    );
    
    res.json({
      success: true,
      data: responseTimeData,
      meta: {
        hours,
        totalWebsites: websites.length,
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

// GET /api/dashboard/summary - สรุปภาพรวม dashboard
router.get('/summary', async (req, res) => {
  try {
    const websites = WebsiteModel.findAll();
    
    const statusCounts = {
      up: websites.filter((w) => w.status === 'up').length,
      down: websites.filter((w) => w.status === 'down').length,
      unknown: websites.filter((w) => w.status === 'unknown').length,
    };
    
    res.json({
      success: true,
      data: {
        totalWebsites: websites.length,
        statusCounts,
        averageResponseTime: websites.length > 0
          ? websites.reduce((sum, w) => sum + w.responseTime, 0) / websites.length
          : 0,
        averageUptime: websites.length > 0
          ? websites.reduce((sum, w) => sum + w.uptimePercentage, 0) / websites.length
          : 0,
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

export default router;
