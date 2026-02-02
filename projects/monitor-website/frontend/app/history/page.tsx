'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Website, Incident } from '@/types';
import { IncidentTable } from '@/components/IncidentTable';
import { IncidentDistributionChart, DowntimeTrendChart } from '@/components/IncidentCharts';
import { Select, DateRangePicker } from '@/components/Filters';
import { formatUptime, formatDuration } from '@/lib/utils';

// Mock data
const mockWebsites: Website[] = [
  { id: '1', name: 'Google', url: 'https://google.com', status: 'up', uptime24h: 99.99, uptime7d: 99.95, uptime30d: 99.98, responseTime: 120, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '2', name: 'GitHub', url: 'https://github.com', status: 'up', uptime24h: 99.95, uptime7d: 99.90, uptime30d: 99.92, responseTime: 250, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '3', name: 'AWS', url: 'https://aws.amazon.com', status: 'unknown', uptime24h: 98.50, uptime7d: 99.20, uptime30d: 99.50, responseTime: 800, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '4', name: 'Example Site', url: 'https://example.com', status: 'down', uptime24h: 95.00, uptime7d: 97.50, uptime30d: 98.00, responseTime: 0, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: false },
  { id: '5', name: 'Vercel', url: 'https://vercel.com', status: 'up', uptime24h: 99.99, uptime7d: 99.98, uptime30d: 99.99, responseTime: 180, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
];

const mockIncidents: Incident[] = [
  { id: '1', websiteId: '4', websiteName: 'Example Site', status: 'down', startedAt: new Date(Date.now() - 3600000).toISOString(), endedAt: null, duration: null, message: 'Connection timeout' },
  { id: '2', websiteId: '3', websiteName: 'AWS', status: 'up', startedAt: new Date(Date.now() - 7200000).toISOString(), endedAt: new Date(Date.now() - 3600000).toISOString(), duration: 60, message: 'High latency detected' },
  { id: '3', websiteId: '9', websiteName: 'Twitter', status: 'up', startedAt: new Date(Date.now() - 86400000).toISOString(), endedAt: new Date(Date.now() - 84600000).toISOString(), duration: 30, message: '502 Bad Gateway' },
  { id: '4', websiteId: '2', websiteName: 'GitHub', status: 'up', startedAt: new Date(Date.now() - 172800000).toISOString(), endedAt: new Date(Date.now() - 171000000).toISOString(), duration: 30, message: 'Service unavailable' },
  { id: '5', websiteId: '1', websiteName: 'Google', status: 'up', startedAt: new Date(Date.now() - 259200000).toISOString(), endedAt: new Date(Date.now() - 259140000).toISOString(), duration: 1.5, message: 'Brief outage' },
  { id: '6', websiteId: '3', websiteName: 'AWS', status: 'up', startedAt: new Date(Date.now() - 345600000).toISOString(), endedAt: new Date(Date.now() - 345240000).toISOString(), duration: 6, message: 'Region issue' },
  { id: '7', websiteId: '4', websiteName: 'Example Site', status: 'up', startedAt: new Date(Date.now() - 432000000).toISOString(), endedAt: new Date(Date.now() - 431640000).toISOString(), duration: 6, message: 'Server restart' },
];

const mockDistributionData = [
  { name: 'Example Site', value: 2 },
  { name: 'AWS', value: 2 },
  { name: 'GitHub', value: 1 },
  { name: 'Google', value: 1 },
  { name: 'Twitter', value: 1 },
];

const mockDowntimeTrend = [
  { date: 'Jan 28', downtime: 6 },
  { date: 'Jan 29', downtime: 0 },
  { date: 'Jan 30', downtime: 1.5 },
  { date: 'Jan 31', downtime: 30 },
  { date: 'Feb 1', downtime: 90 },
  { date: 'Feb 2', downtime: 60 },
];

export default function HistoryPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [websitesData, incidentsData] = await Promise.all([
        api.getAllWebsites(),
        api.getIncidents(),
      ]);
      setWebsites(websitesData);
      setIncidents(incidentsData);
    } catch (error) {
      console.log('Using mock data');
      setWebsites(mockWebsites);
      setIncidents(mockIncidents);
    } finally {
      setLoading(false);
    }
  };

  // Filter incidents
  const filteredIncidents = incidents.filter((incident) => {
    if (selectedWebsite && incident.websiteId !== selectedWebsite) return false;
    if (selectedStatus && incident.status !== selectedStatus) return false;
    if (startDate && new Date(incident.startedAt) < new Date(startDate)) return false;
    if (endDate && new Date(incident.startedAt) > new Date(endDate)) return false;
    return true;
  });

  // Calculate stats
  const totalDowntime = incidents.reduce((acc, i) => acc + (i.duration || 0), 0);
  const avgDowntime = incidents.length > 0 ? totalDowntime / incidents.length : 0;

  const websiteOptions = [
    { value: '', label: 'All Websites' },
    ...websites.map((w) => ({ value: w.id, label: w.name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'down', label: 'Down' },
    { value: 'up', label: 'Recovered' },
  ];

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
        <h1 className="text-3xl font-bold text-white">History</h1>
        <p className="text-muted mt-1">View incident history and uptime statistics</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Website"
            options={websiteOptions}
            value={selectedWebsite}
            onChange={setSelectedWebsite}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
          <DateRangePicker
            label="Date Range"
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Incident Distribution</h2>
          <IncidentDistributionChart data={mockDistributionData} />
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Downtime Trend</h2>
          <DowntimeTrendChart data={mockDowntimeTrend} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted text-sm">Total Incidents</p>
          <p className="text-2xl font-bold text-white mt-1">{incidents.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted text-sm">Total Downtime</p>
          <p className="text-2xl font-bold text-offline mt-1">{formatDuration(totalDowntime)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted text-sm">Avg Downtime</p>
          <p className="text-2xl font-bold text-warning mt-1">{formatDuration(avgDowntime)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted text-sm">Active Issues</p>
          <p className="text-2xl font-bold text-offline mt-1">{incidents.filter(i => i.status === 'down').length}</p>
        </div>
      </div>

      {/* Uptime Stats per Website */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">Uptime Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-medium text-muted">Website</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted">24 Hours</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted">7 Days</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted">30 Days</th>
              </tr>
            </thead>
            <tbody>
              {websites.map((website) => (
                <tr key={website.id} className="border-b border-border/50 hover:bg-white/5">
                  <td className="py-4 px-4 font-medium text-white">{website.name}</td>
                  <td className="py-4 px-4">
                    <span className={
                      website.uptime24h >= 99 ? 'text-online' :
                      website.uptime24h >= 95 ? 'text-warning' : 'text-offline'
                    }>
                      {formatUptime(website.uptime24h)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={
                      website.uptime7d >= 99 ? 'text-online' :
                      website.uptime7d >= 95 ? 'text-warning' : 'text-offline'
                    }>
                      {formatUptime(website.uptime7d)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={
                      website.uptime30d >= 99 ? 'text-online' :
                      website.uptime30d >= 95 ? 'text-warning' : 'text-offline'
                    }>
                      {formatUptime(website.uptime30d)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Incident History</h2>
          <span className="text-muted text-sm">{filteredIncidents.length} incidents</span>
        </div>
        <IncidentTable incidents={filteredIncidents} />
      </div>
    </div>
  );
}
