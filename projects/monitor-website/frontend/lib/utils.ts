import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '-';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatUptime(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: 'up' | 'down' | 'unknown'): string {
  switch (status) {
    case 'up':
      return 'bg-online';
    case 'down':
      return 'bg-offline';
    case 'unknown':
      return 'bg-warning';
    default:
      return 'bg-gray-500';
  }
}

export function getStatusText(status: 'up' | 'down' | 'unknown'): string {
  switch (status) {
    case 'up':
      return 'Up';
    case 'down':
      return 'Down';
    case 'unknown':
      return 'Unknown';
    default:
      return 'Unknown';
  }
}
