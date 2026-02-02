// services/monitor.ts - Monitor Service
import { Website, WebsiteStatus, ResponseTimeData, UptimeData } from '../types';
import { WebsiteModel } from '../models/website';
import { IncidentModel } from '../models/incident';

export class MonitorService {
  // Check website status and return 'up' | 'down' | 'unknown'
  static async checkWebsite(url: string): Promise<{
    status: WebsiteStatus;
    responseTime: number;
    message: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Simulate HTTP check
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'up',
          responseTime,
          message: 'Website is reachable',
        };
      } else {
        return {
          status: 'down',
          responseTime,
          message: `HTTP error: ${response.status}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          return {
            status: 'down',
            responseTime,
            message: 'Connection timeout',
          };
        }
        return {
          status: 'unknown',
          responseTime,
          message: `Error: ${error.message}`,
        };
      }
      
      return {
        status: 'unknown',
        responseTime,
        message: 'Unknown error occurred',
      };
    }
  }

  // Map old status values to new ones
  static mapStatus(oldStatus: 'online' | 'warning' | 'offline' | string): WebsiteStatus {
    const statusMap: Record<string, WebsiteStatus> = {
      'online': 'up',
      'warning': 'unknown',
      'offline': 'down',
    };
    return statusMap[oldStatus] || 'unknown';
  }

  // Get response time history for chart data
  static async getResponseTimeHistory(
    websiteId: string,
    hours: number = 24
  ): Promise<ResponseTimeData[]> {
    const website = WebsiteModel.findById(websiteId);
    if (!website) {
      throw new Error('Website not found');
    }

    // Generate mock historical data
    const data: ResponseTimeData[] = [];
    const now = new Date();
    
    for (let i = hours * 4; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000); // Every 15 minutes
      data.push({
        timestamp,
        responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        status: website.status,
      });
    }
    
    return data;
  }

  // Get uptime data for a specific website
  static async getUptimeData(
    websiteId: string,
    days: number = 30
  ): Promise<UptimeData[]> {
    const website = WebsiteModel.findById(websiteId);
    if (!website) {
      throw new Error('Website not found');
    }

    // Generate mock daily uptime data
    const data: UptimeData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const totalChecks = 1440; // Checks per day (every minute)
      const upChecks = Math.floor(totalChecks * (website.uptimePercentage / 100));
      
      data.push({
        date: date.toISOString().split('T')[0],
        uptime: website.uptimePercentage,
        totalChecks,
        upChecks,
      });
    }
    
    return data;
  }

  // Run monitoring check on all websites
  static async runChecks(): Promise<void> {
    const websites = WebsiteModel.findAll();
    
    for (const website of websites) {
      const result = await this.checkWebsite(website.url);
      
      // Update website status
      WebsiteModel.updateStatus(website.id, result.status);
      
      // Create incident if website is down
      if (result.status === 'down') {
        const ongoingIncidents = IncidentModel.findOngoing();
        const existingIncident = ongoingIncidents.find(
          (i) => i.websiteId === website.id
        );
        
        if (!existingIncident) {
          IncidentModel.create({
            websiteId: website.id,
            websiteName: website.name,
            status: 'down',
            startedAt: new Date(),
            message: result.message,
          });
        }
      }
      
      // Resolve incidents if website is back up
      if (result.status === 'up') {
        const ongoingIncidents = IncidentModel.findOngoing();
        const existingIncident = ongoingIncidents.find(
          (i) => i.websiteId === website.id
        );
        
        if (existingIncident) {
          IncidentModel.resolve(existingIncident.id);
        }
      }
    }
  }
}
