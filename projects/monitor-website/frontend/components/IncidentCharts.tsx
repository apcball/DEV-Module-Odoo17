'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface IncidentDistributionData {
  name: string;
  value: number;
}

interface IncidentDistributionChartProps {
  data: IncidentDistributionData[];
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

export function IncidentDistributionChart({ data }: IncidentDistributionChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ color: '#F8FAFC' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DowntimeTrendData {
  date: string;
  downtime: number;
}

interface DowntimeTrendChartProps {
  data: DowntimeTrendData[];
}

export function DowntimeTrendChart({ data }: DowntimeTrendChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            tick={{ fill: '#64748B', fontSize: 12 }}
            tickLine={{ stroke: '#64748B' }}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fill: '#64748B', fontSize: 12 }}
            tickLine={{ stroke: '#64748B' }}
            tickFormatter={(value) => `${value}m`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
            }}
            formatter={(value: number) => [`${value} minutes`, 'Downtime']}
          />
          <Bar
            dataKey="downtime"
            fill="#EF4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
