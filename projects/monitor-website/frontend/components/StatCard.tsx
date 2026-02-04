'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'green' | 'yellow' | 'red' | 'blue';
}

const colorConfig = {
  green: {
    bg: 'bg-online/10',
    border: 'border-online/20',
    icon: 'text-online',
  },
  yellow: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    icon: 'text-warning',
  },
  red: {
    bg: 'bg-offline/10',
    border: 'border-offline/20',
    icon: 'text-offline',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
  },
};

export function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const colors = colorConfig[color];

  return (
    <div
      className={cn(
        'rounded-xl p-6 border',
        colors.bg,
        colors.border,
        'bg-card'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
          {trend && (
            <p
              className={cn(
                'text-sm mt-2',
                trend.isPositive ? 'text-online' : 'text-offline'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-muted ml-1">vs last 24h</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-lg',
            colors.bg
          )}
        >
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
      </div>
    </div>
  );
}
