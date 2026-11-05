import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Users,
  Radio,
  MessageSquare,
  Image,
  BarChart3,
  Settings,
} from 'lucide-react';

export type TabKey =
  | 'overview'
  | 'map'
  | 'requests'
  | 'responders'
  | 'gateway'
  | 'comms'
  | 'multimedia'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  newRequestsCount: number;
  pendingSyncCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  newRequestsCount,
  pendingSyncCount = 0,
}) => {
  const navItems = [
    { key: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    { key: 'map', label: 'Live Tactical Map', icon: MapPin },
    {
      key: 'requests',
      label: 'Emergency Requests',
      icon: AlertTriangle,
      badge: newRequestsCount > 0 ? newRequestsCount : undefined,
      badgeColor: 'bg-red-600',
    },
    { key: 'responders', label: 'Responder Units', icon: Users },
    {
      key: 'gateway',
      label: 'SMS Gateway & Sync',
      icon: Radio,
      badge: pendingSyncCount > 0 ? `${pendingSyncCount} offline` : undefined,
      badgeColor: 'bg-amber-600',
    },
    { key: 'comms', label: 'Two-Way SMS History', icon: MessageSquare },
    { key: 'multimedia', label: 'Deferred Photos', icon: Image },
    { key: 'analytics', label: 'Disaster Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Settings & Health', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between h-[calc(100vh-4rem)]">
      <div className="py-4 space-y-1 px-3">
        <div className="px-3 pb-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase">
          Tactical Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key as TabKey)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-red-600/15 text-red-400 border border-red-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${item.badgeColor || 'bg-slate-700'}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>STORE & FORWARD</span>
          <span className="text-emerald-400 font-bold">ARMED</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          Idempotent queue active. Zero message drop policy in effect.
        </div>
      </div>
    </aside>
  );
};
