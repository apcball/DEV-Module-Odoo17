'use client';

import { useState } from 'react';
import { Website } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatUptime, formatResponseTime, formatDate } from '@/lib/utils';
import { ExternalLink, Edit2, Trash2, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebsiteTableProps {
  websites: Website[];
  onEdit?: (website: Website) => void;
  onDelete?: (website: Website) => void;
  onToggleActive?: (website: Website) => void;
  onToggleNotifications?: (website: Website) => void;
  showActions?: boolean;
}

export function WebsiteTable({
  websites,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleNotifications,
  showActions = true,
}: WebsiteTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Website;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: keyof Website) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const sortedWebsites = [...websites].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th
              className="text-left py-4 px-4 text-sm font-medium text-muted cursor-pointer hover:text-white"
              onClick={() => handleSort('name')}
            >
              Website {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-left py-4 px-4 text-sm font-medium text-muted cursor-pointer hover:text-white"
              onClick={() => handleSort('status')}
            >
              Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-left py-4 px-4 text-sm font-medium text-muted cursor-pointer hover:text-white"
              onClick={() => handleSort('uptime24h')}
            >
              Uptime 24h {sortConfig?.key === 'uptime24h' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-left py-4 px-4 text-sm font-medium text-muted cursor-pointer hover:text-white"
              onClick={() => handleSort('responseTime')}
            >
              Response {sortConfig?.key === 'responseTime' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-left py-4 px-4 text-sm font-medium text-muted cursor-pointer hover:text-white"
              onClick={() => handleSort('lastChecked')}
            >
              Last Checked {sortConfig?.key === 'lastChecked' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            {showActions && (
              <th className="text-left py-4 px-4 text-sm font-medium text-muted">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedWebsites.map((website) => (
            <tr
              key={website.id}
              className="border-b border-border/50 hover:bg-white/5 transition-colors"
            >
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    website.isActive ? 'bg-online' : 'bg-muted'
                  )} />
                  <div>
                    <p className="font-medium text-white">{website.name}</p>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted hover:text-blue-400 flex items-center gap-1"
                    >
                      {website.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <StatusBadge status={website.status} size="sm" />
              </td>
              <td className="py-4 px-4">
                <span className={cn(
                  'font-medium',
                  website.uptime24h >= 99 ? 'text-online' :
                  website.uptime24h >= 95 ? 'text-warning' : 'text-offline'
                )}>
                  {formatUptime(website.uptime24h)}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-white">
                  {formatResponseTime(website.responseTime)}
                </span>
              </td>
              <td className="py-4 px-4 text-muted text-sm">
                {formatDate(website.lastChecked)}
              </td>
              {showActions && (
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleNotifications?.(website)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        website.notificationsEnabled
                          ? 'text-online hover:bg-online/10'
                          : 'text-muted hover:bg-white/5'
                      )}
                      title={website.notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                    >
                      {website.notificationsEnabled ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onEdit?.(website)}
                      className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(website)}
                      className="p-2 rounded-lg text-muted hover:text-offline hover:bg-offline/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
