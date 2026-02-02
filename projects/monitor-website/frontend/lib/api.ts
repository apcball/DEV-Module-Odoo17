import axios, { AxiosInstance } from 'axios';
import {
  Website,
  Incident,
  DashboardStats,
  WebsiteUptimeData,
  ResponseTimeDataPoint,
  CreateWebsiteRequest,
  UpdateWebsiteRequest,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Functions
export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard');
    return response.data;
  },

  getUptimeChart: async (hours: number = 24): Promise<WebsiteUptimeData[]> => {
    const response = await apiClient.get(`/dashboard/uptime?hours=${hours}`);
    return response.data;
  },

  getResponseTimeChart: async (hours: number = 24): Promise<ResponseTimeDataPoint[]> => {
    const response = await apiClient.get(`/dashboard/response-time?hours=${hours}`);
    return response.data;
  },

  getRecentIncidents: async (limit: number = 10): Promise<Incident[]> => {
    const response = await apiClient.get(`/dashboard/incidents?limit=${limit}`);
    return response.data;
  },

  // Websites
  getAllWebsites: async (): Promise<Website[]> => {
    const response = await apiClient.get('/websites');
    return response.data;
  },

  getWebsiteById: async (id: string): Promise<Website> => {
    const response = await apiClient.get(`/websites/${id}`);
    return response.data;
  },

  createWebsite: async (data: CreateWebsiteRequest): Promise<Website> => {
    const response = await apiClient.post('/websites', data);
    return response.data;
  },

  updateWebsite: async (id: string, data: UpdateWebsiteRequest): Promise<Website> => {
    const response = await apiClient.put(`/websites/${id}`, data);
    return response.data;
  },

  deleteWebsite: async (id: string): Promise<void> => {
    await apiClient.delete(`/websites/${id}`);
  },

  // History/Incidents
  getIncidents: async (params?: {
    websiteId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<Incident[]> => {
    const response = await apiClient.get('/incidents', { params });
    return response.data;
  },

  getIncidentStats: async (): Promise<{
    totalIncidents: number;
    avgDowntime: number;
    incidentByWebsite: { websiteId: string; count: number }[];
  }> => {
    const response = await apiClient.get('/incidents/stats');
    return response.data;
  },

  getUptimeStats: async (websiteId: string): Promise<{
    uptime24h: number;
    uptime7d: number;
    uptime30d: number;
  }> => {
    const response = await apiClient.get(`/websites/${websiteId}/uptime`);
    return response.data;
  },
};

export default apiClient;
