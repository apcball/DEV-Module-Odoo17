// routes/websites.ts - Websites API Routes
import { Router } from 'express';
import { WebsiteModel } from '../models/website';
import { MonitorService } from '../services/monitor';
import { Website } from '../types';

const router = Router();

// GET /api/websites - ดึงรายการ websites ทั้งหมด
router.get('/', async (req, res) => {
  try {
    const websites = WebsiteModel.findAll();
    res.json({
      success: true,
      data: websites,
      meta: {
        total: websites.length,
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

// POST /api/websites - สร้าง website ใหม่
router.post('/', async (req, res) => {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Name and URL are required',
      });
    }
    
    const website = WebsiteModel.create({
      name,
      url,
      status: 'unknown',
      lastChecked: new Date(),
      uptimePercentage: 100,
      responseTime: 0,
    });
    
    res.status(201).json({
      success: true,
      data: website,
      message: 'Website created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/websites/:id - ดึง website ตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const website = WebsiteModel.findById(id);
    
    if (!website) {
      return res.status(404).json({
        success: false,
        error: 'Website not found',
      });
    }
    
    res.json({
      success: true,
      data: website,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/websites/:id/uptime - uptime ของเว็บเฉพาะตัว
router.get('/:id/uptime', async (req, res) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    const website = WebsiteModel.findById(id);
    if (!website) {
      return res.status(404).json({
        success: false,
        error: 'Website not found',
      });
    }
    
    const uptimeData = await MonitorService.getUptimeData(id, days);
    
    res.json({
      success: true,
      data: {
        websiteId: id,
        websiteName: website.name,
        days,
        uptimeData,
        overallUptime: website.uptimePercentage,
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

// PUT /api/websites/:id - อัพเดท website
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const website = WebsiteModel.update(id, updates);
    
    if (!website) {
      return res.status(404).json({
        success: false,
        error: 'Website not found',
      });
    }
    
    res.json({
      success: true,
      data: website,
      message: 'Website updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/websites/:id - ลบ website
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = WebsiteModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Website not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Website deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/websites/:id/check - ตรวจสอบ website ทันที
router.post('/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    const website = WebsiteModel.findById(id);
    
    if (!website) {
      return res.status(404).json({
        success: false,
        error: 'Website not found',
      });
    }
    
    const result = await MonitorService.checkWebsite(website.url);
    WebsiteModel.updateStatus(id, result.status);
    
    res.json({
      success: true,
      data: {
        websiteId: id,
        ...result,
        checkedAt: new Date().toISOString(),
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
