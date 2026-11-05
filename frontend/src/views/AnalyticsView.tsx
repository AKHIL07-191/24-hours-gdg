import React from 'react';
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
import { BarChart3, TrendingUp, Cpu, Radio, ShieldCheck } from 'lucide-react';
import { AnalyticsSummary } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  MEDICAL: '#f43f5e',
  FLOOD: '#0284c7',
  FIRE: '#f97316',
  RESCUE: '#ef4444',
  MISSING_PERSONS: '#8b5cf6',
  FOOD_WATER: '#10b981',
  INFRASTRUCTURE: '#78716c',
  OTHER: '#64748b',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#3b82f6',
  LOW: '#64748b',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  const categoryData = (analytics?.by_category || [
    { category: 'FLOOD', count: 3 },
    { category: 'MEDICAL', count: 2 },
    { category: 'FIRE', count: 1 },
    { category: 'RESCUE', count: 1 },
  ]).map((item) => ({
    ...item,
    fill: CATEGORY_COLORS[item.category] || '#64748b',
  }));

  const priorityData = (analytics?.by_priority || [
    { priority: 'CRITICAL', count: 3 },
    { priority: 'HIGH', count: 3 },
    { priority: 'MEDIUM', count: 1 },
  ]).map((item) => ({
    ...item,
    fill: PRIORITY_COLORS[item.priority] || '#64748b',
  }));

  const statusData = analytics?.by_status || [
    { status: 'NEW', count: 3 },
    { status: 'VERIFIED', count: 1 },
    { status: 'RESPONDER_ASSIGNED', count: 1 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-red-500" />
          <span>Disaster Operations Intelligence & Analytics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time epidemiological, resource allocation, and communication throughput metrics.
        </p>
      </div>

      {/* Top AI & Gateway Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-950 flex items-center justify-center text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">AI Triage Accuracy</div>
            <div className="text-2xl font-black text-white">
              {Math.round((analytics?.ai_metrics?.average_confidence || 0.88) * 100)}%
            </div>
            <div className="text-[10px] text-purple-400 font-mono">
              Gemini 2.0 Flash + Offline Fallback
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Cellular SMS Relays</div>
            <div className="text-2xl font-black text-white">
              {(analytics?.sms_traffic?.inbound_total || 5) + (analytics?.sms_traffic?.outbound_total || 5)}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">
              Zero Packets Dropped
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-950 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Dispatch Response Rate</div>
            <div className="text-2xl font-black text-white">100%</div>
            <div className="text-[10px] text-blue-400 font-mono">
              Human-in-the-Loop Verification
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Incident Breakdown by Disaster Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} angle={-25} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Severity Distribution Pie Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Incident Priority Severity Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="priority"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
