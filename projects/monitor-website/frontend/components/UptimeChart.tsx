'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { WebsiteUptimeData } from '@/types';

interface UptimeChartProps {
  data: WebsiteUptimeData[];
}

const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

export function UptimeChart({ data }: UptimeChartProps) {
  // Transform data for Recharts
  const transformedData = data[0]?.data.map((point, index) => {
    const result: Record<string, string | number> = {
      time: point.time,
    };
    data.forEach((website) => {
      result[website.websiteName] = website.data[index]?.uptime ?? 0;
    });
    return result;
  }) || [];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={transformedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            stroke="#64748B"
            tick={{ fill: '#64748B', fontSize: 12 }}
            tickLine={{ stroke: '#64748B' }}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fill: '#64748B', fontSize: 12 }}
            tickLine={{ stroke: '#64748B' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
            }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
          />
          <Legend
            wrapperStyle={{ color: '#F8FAFC' }}
          />
          {data.map((website, index) => (
            <Line
              key={website.websiteId}
              type="monotone"
              dataKey={website.websiteName}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
