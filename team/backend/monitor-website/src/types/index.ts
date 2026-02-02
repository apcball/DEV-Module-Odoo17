// ============================================
// Type Definitions for Monitor Website API
// ============================================

// Website Entity
export interface Website {
  id: number;
  name: string;
  url: string;
  description?: string;
  check_interval_minutes: number;
  expected_status_code: number;
  is_active: boolean;
  current_status: 'up' | 'down' | 'unknown';
  telegram_chat_id?: string;
  last_check_at?: Date;
  last_response_time_ms?: number;
  last_error_message?: string;
  total_checks: number;
  successful_checks: number;
  uptime_percentage: number;
  created_at: Date;
  updated_at: Date;
}

// Create/Update Website DTO
export interface CreateWebsiteDTO {
  name: string;
  url: string;
  description?: string;
  check_interval_minutes?: number;
  expected_status_code?: number;
  telegram_chat_id?: string;
}

export interface UpdateWebsiteDTO {
  name?: string;
  url?: string;
  description?: string;
  check_interval_minutes?: number;
  expected_status_code?: number;
  is_active?: boolean;
  telegram_chat_id?: string;
}

// Check Log Entity
export interface CheckLog {
  id: number;
  website_id: number;
  status: 'up' | 'down';
  status_code?: number;
  response_time_ms?: number;
  error_message?: string;
  checked_at: Date;
  checked_by: 'cron' | 'manual' | 'api';
  response_headers?: Record<string, string>;
  response_body_preview?: string;
}

// Incident Entity
export interface Incident {
  id: number;
  website_id: number;
  title: string;
  description?: string;
  severity: 'critical' | 'warning' | 'info';
  started_at: Date;
  resolved_at?: Date;
  duration_minutes?: number;
  status: 'ongoing' | 'resolved' | 'acknowledged';
  error_message?: string;
  status_code?: number;
  notification_sent: boolean;
  notification_sent_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Dashboard Data
export interface DashboardStats {
  totalWebsites: number;
  upCount: number;
  downCount: number;
  unknownCount: number;
  overallUptime: number;
  activeIncidents: number;
  incidents24h: number;
  avgResponseTime: number;
}

export interface WebsiteStatusOverview {
  id: number;
  name: string;
  url: string;
  current_status: 'up' | 'down' | 'unknown';
  last_check_at?: Date;
  last_response_time_ms?: number;
  uptime_percentage: number;
  ongoing_incidents: number;
  incidents_24h: number;
}

export interface DashboardData {
  stats: DashboardStats;
  websites: WebsiteStatusOverview[];
  recentIncidents: Incident[];
  recentLogs: CheckLog[];
}

// Check Result
export interface CheckResult {
  status: 'up' | 'down' | 'unknown';
  statusCode?: number;
  responseTimeMs: number;
  errorMessage?: string;
  timestamp: Date;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Query Parameters
export interface IncidentQueryParams {
  websiteId?: number;
  status?: 'ongoing' | 'resolved' | 'acknowledged';
  limit?: number;
  offset?: number;
}

export interface LogQueryParams {
  websiteId?: number;
  status?: 'up' | 'down';
  limit?: number;
  offset?: number;
  from?: Date;
  to?: Date;
}