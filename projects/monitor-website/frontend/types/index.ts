export interface Website {
  id: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'unknown';
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  responseTime: number;
  lastChecked: string;
  isActive: boolean;
  notificationsEnabled: boolean;
  telegramChatId?: string;
}

export interface Incident {
  id: string;
  websiteId: string;
  websiteName: string;
  status: 'down' | 'up';
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  message: string;
}

export interface DashboardStats {
  totalWebsites: number;
  upCount: number;
  downCount: number;
  unknownCount: number;
  avgResponseTime: number;
  avgUptime: number;
}

export interface UptimeDataPoint {
  time: string;
  uptime: number;
}

export interface ResponseTimeDataPoint {
  time: string;
  responseTime: number;
}

export interface WebsiteUptimeData {
  websiteId: string;
  websiteName: string;
  data: UptimeDataPoint[];
}

export interface CreateWebsiteRequest {
  name: string;
  url: string;
  isActive?: boolean;
  notificationsEnabled?: boolean;
  telegramChatId?: string;
}

export interface UpdateWebsiteRequest {
  name?: string;
  url?: string;
  isActive?: boolean;
  notificationsEnabled?: boolean;
  telegramChatId?: string;
}

export type StatusType = 'up' | 'down' | 'unknown';
