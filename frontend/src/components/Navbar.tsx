import React, { useState, useEffect } from 'react';
import { Radio, ShieldAlert, Cpu, LogOut, User as UserIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC<{ onRefreshAll?: () => void }> = ({ onRefreshAll }) => {
  const { user, logout } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString() + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-30 sticky top-0">
      {/* Brand & Incident Mode */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-white">RESQ<span className="text-red-500">-NET</span></span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 tracking-wider">
                DISASTER RESILIENT
              </span>
            </div>
            <div className="text-[10px] text-slate-400 tracking-wide font-mono">
              EMERGENCY COORDINATION & CELLULAR SMS GATEWAY
            </div>
          </div>
        </div>
      </div>

      {/* Operational Indicators */}
      <div className="hidden lg:flex items-center space-x-6">
        {/* Gateway Uplink Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-950/70 border border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Radio className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-mono text-slate-300">
            SMS GATEWAY: <strong className="text-emerald-400">ONLINE</strong>
          </span>
        </div>

        {/* AI Engine Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-950/70 border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-mono text-slate-300">
            AI ENGINE: <strong className="text-blue-400">GEMINI + FALLBACK</strong>
          </span>
        </div>

        {/* Clock */}
        <div className="text-xs font-mono text-slate-400 bg-slate-950/40 px-2.5 py-1 rounded border border-slate-800/80">
          {timeStr}
        </div>
      </div>

      {/* User Controls */}
      <div className="flex items-center space-x-4">
        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Refresh System Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {user && (
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-200">{user.full_name}</div>
              <div className="text-[10px] font-mono text-slate-400">{user.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
