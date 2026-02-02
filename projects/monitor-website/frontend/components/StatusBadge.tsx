'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'up' | 'down' | 'unknown';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  up: {
    color: 'bg-online',
    text: 'Up',
    textColor: 'text-online',
  },
  down: {
    color: 'bg-offline',
    text: 'Down',
    textColor: 'text-offline',
  },
  unknown: {
    color: 'bg-warning',
    text: 'Unknown',
    textColor: 'text-warning',
  },
};

const sizeConfig = {
  sm: {
    dot: 'w-2 h-2',
    text: 'text-xs',
  },
  md: {
    dot: 'w-3 h-3',
    text: 'text-sm',
  },
  lg: {
    dot: 'w-4 h-4',
    text: 'text-base',
  },
};

export function StatusBadge({ status, showText = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'rounded-full animate-pulse',
          config.color,
          sizeClass.dot
        )}
      />
      {showText && (
        <span className={cn('font-medium', sizeClass.text, config.textColor)}>
          {config.text}
        </span>
      )}
    </div>
  );
}
