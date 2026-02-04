// types/index.ts - กำหนด Type สำหรับทั้งระบบ

export type WebsiteStatus = 'up' | 'down' | 'unknown';

export interface Website {
  id: string;
  name: string;
  url: string;
  status: WebsiteStatus;
  lastChecked: Date;
  uptimePercentage: number;
  responseTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  websiteId: string;
  websiteName: string;
  status: WebsiteStatus;
  startedAt: Date;
  resolvedAt?: Date;
  duration?: number; // in minutes
  message: string;
  createdAt: Date;
}

export interface ResponseTimeData {
  timestamp: Date;
  responseTime: number;
  status: WebsiteStatus;
}

export interface UptimeData {
  date: string;
  uptime: number; // percentage
  totalChecks: number;
  upChecks: number;
}

export interface IncidentStats {
  total: number;
  resolved: number;
  ongoing: number;
  averageResolutionTime: number; // in minutes
}

export interface DashboardResponseTime {
  websiteId: string;
  websiteName: string;
  data: ResponseTimeData[];
}
