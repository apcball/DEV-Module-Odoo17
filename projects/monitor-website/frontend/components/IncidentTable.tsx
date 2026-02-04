'use client';

import { Incident } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatDuration, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface IncidentTableProps {
  incidents: Incident[];
}

export function IncidentTable({ incidents }: IncidentTableProps) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 text-sm font-medium text-muted">Website</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-muted">Status</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-muted">Started</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-muted">Ended</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-muted">Duration</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-muted">Message</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              className="border-b border-border/50 hover:bg-white/5 transition-colors"
            >
              <td className="py-4 px-4">
                <span className="font-medium text-white">{incident.websiteName}</span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      incident.status === 'down' ? 'bg-offline' : 'bg-online'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      incident.status === 'down' ? 'text-offline' : 'text-online'
                    )}
                  >
                    {incident.status === 'down' ? 'Down' : 'Recovered'}
                  </span>
                </div>
              </td>
              <td className="py-4 px-4 text-muted text-sm">
                {formatDate(incident.startedAt)}
              </td>
              <td className="py-4 px-4 text-muted text-sm">
                {incident.endedAt ? formatDate(incident.endedAt) : '-'}
              </td>
              <td className="py-4 px-4">
                <span className="text-white">
                  {formatDuration(incident.duration)}
                </span>
              </td>
              <td className="py-4 px-4 text-muted text-sm max-w-xs truncate">
                {incident.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
