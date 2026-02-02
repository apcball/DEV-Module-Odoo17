'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Website, DashboardStats, WebsiteUptimeData, ResponseTimeDataPoint, Incident } from '@/types';
import { StatCard } from '@/components/StatCard';
import { WebsiteTable } from '@/components/WebsiteTable';
import { UptimeChart } from '@/components/UptimeChart';
import { ResponseTimeChart } from '@/components/ResponseTimeChart';
import { IncidentTable } from '@/components/IncidentTable';
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock, Percent } from 'lucide-react';

// Mock data for initial development
const mockWebsites: Website[] = [
  { id: '1', name: 'Google', url: 'https://google.com', status: 'up', uptime24h: 99.99, uptime7d: 99.95, uptime30d: 99.98, responseTime: 120, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '2', name: 'GitHub', url: 'https://github.com', status: 'up', uptime24h: 99.95, uptime7d: 99.90, uptime30d: 99.92, responseTime: 250, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '3', name: 'AWS', url: 'https://aws.amazon.com', status: 'unknown', uptime24h: 98.50, uptime7d: 99.20, uptime30d: 99.50, responseTime: 800, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '4', name: 'Example Site', url: 'https://example.com', status: 'down', uptime24h: 95.00, uptime7d: 97.50, uptime30d: 98.00, responseTime: 0, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: false },
  { id: '5', name: 'Vercel', url: 'https://vercel.com', status: 'up', uptime24h: 99.99, uptime7d: 99.98, uptime30d: 99.99, responseTime: 180, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '6', name: 'Stripe', url: 'https://stripe.com', status: 'up', uptime24h: 99.98, uptime7d: 99.95, uptime30d: 99.97, responseTime: 200, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '7', name: 'Slack', url: 'https://slack.com', status: 'up', uptime24h: 99.90, uptime7d: 99.85, uptime30d: 99.88, responseTime: 300, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '8', name: 'Discord', url: 'https://discord.com', status: 'up', uptime24h: 99.95, uptime7d: 99.90, uptime30d: 99.93, responseTime: 220, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '9', name: 'Twitter', url: 'https://twitter.com', status: 'unknown', uptime24h: 97.00, uptime7d: 98.50, uptime30d: 98.80, responseTime: 1200, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '10', name: 'Netlify', url: 'https://netlify.com', status: 'up', uptime24h: 99.98, uptime7d: 99.95, uptime30d: 99.96, responseTime: 150, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
];

const mockUptimeData: WebsiteUptimeData[] = [
  {
    websiteId: '1',
    websiteName: 'Google',
    data: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      uptime: 99 + Math.random(),
    })),
  },
  {
    websiteId: '5',
    websiteName: 'Vercel',
    data: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      uptime: 99 + Math.random(),
    })),
  },
  {
    websiteId: '3',
    websiteName: 'AWS',
    data: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      uptime: 95 + Math.random() * 5,
    })),
  },
];

const mockResponseTimeData: ResponseTimeDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  responseTime: Math.floor(100 + Math.random() * 400),
}));

const mockIncidents: Incident[] = [
  { id: '1', websiteId: '4', websiteName: 'Example Site', status: 'down', startedAt: new Date(Date.now() - 3600000).toISOString(), endedAt: null, duration: null, message: 'Connection timeout' },
  { id: '2', websiteId: '3', websiteName: 'AWS', status: 'up', startedAt: new Date(Date.now() - 7200000).toISOString(), endedAt: new Date(Date.now() - 3600000).toISOString(), duration: 60, message: 'High latency detected' },
  { id: '3', websiteId: '9', websiteName: 'Twitter', status: 'down', startedAt: new Date(Date.now() - 1800000).toISOString(), endedAt: new Date(Date.now() - 900000).toISOString(), duration: 15, message: '502 Bad Gateway' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [uptimeData, setUptimeData] = useState<WebsiteUptimeData[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeDataPoint[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch from API
        const [statsData, websitesData, uptimeChartData, responseTimeChartData, recentIncidents] = await Promise.all([
          api.getDashboardStats(),
          api.getAllWebsites(),
          api.getUptimeChart(24),
          api.getResponseTimeChart(24),
          api.getRecentIncidents(5),
        ]);
        setStats(statsData);
        setWebsites(websitesData);
        setUptimeData(uptimeChartData);
        setResponseTimeData(responseTimeChartData);
        setIncidents(recentIncidents);
      } catch (error) {
        console.log('Using mock data');
        // Calculate stats from mock data
        const upCount = mockWebsites.filter(w => w.status === 'up').length;
        const downCount = mockWebsites.filter(w => w.status === 'down').length;
        const unknownCount = mockWebsites.filter(w => w.status === 'unknown').length;
        const avgResponseTime = mockWebsites.reduce((acc, w) => acc + w.responseTime, 0) / mockWebsites.length;
        const avgUptime = mockWebsites.reduce((acc, w) => acc + w.uptime24h, 0) / mockWebsites.length;

        setStats({
          totalWebsites: mockWebsites.length,
          upCount,
          downCount,
          unknownCount,
          avgResponseTime,
          avgUptime,
        });
        setWebsites(mockWebsites);
        setUptimeData(mockUptimeData);
        setResponseTimeData(mockResponseTimeData);
        setIncidents(mockIncidents);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-muted mt-1">Overview of your monitored websites</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Up"
          value={stats?.upCount || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Down"
          value={stats?.downCount || 0}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Unknown"
          value={stats?.unknownCount || 0}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Avg Response"
          value={`${Math.round(stats?.avgResponseTime || 0)}ms`}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Avg Uptime"
          value={`${(stats?.avgUptime || 0).toFixed(2)}%`}
          icon={Percent}
          color="green"
        />
      </div>

      {/* Websites Table */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Monitored Websites</h2>
          <span className="text-muted text-sm">{websites.length} websites</span>
        </div>
        <WebsiteTable websites={websites} showActions={false} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Uptime (24h)</h2>
          <UptimeChart data={uptimeData} />
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Response Time</h2>
          <ResponseTimeChart data={responseTimeData} />
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Incidents</h2>
          <span className="text-muted text-sm">Last 24 hours</span>
        </div>
        <IncidentTable incidents={incidents} />
      </div>
    </div>
  );
}
