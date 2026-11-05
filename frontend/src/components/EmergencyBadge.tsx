import React from 'react';
import { EmergencyPriority, EmergencyStatus, EmergencyCategory } from '../types';

export const PriorityBadge: React.FC<{ priority: EmergencyPriority }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-950 text-red-400 border border-red-700/60 animate-pulse">
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-700/50">
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-950 text-blue-400 border border-blue-700/50">
          MEDIUM
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          LOW
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: EmergencyStatus }> = ({ status }) => {
  switch (status) {
    case 'NEW':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-700/60">
          ● NEW
        </span>
      );
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-700/60">
          ✓ VERIFIED
        </span>
      );
    case 'RESPONDER_ASSIGNED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700/60">
          ⚡ ASSIGNED
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
          ↻ IN PROGRESS
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
          ✔ RESOLVED
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
          ✕ REJECTED
        </span>
      );
  }
};

export const CategoryBadge: React.FC<{ category: EmergencyCategory }> = ({ category }) => {
  const map: Record<string, { label: string; color: string }> = {
    MEDICAL: { label: 'Medical', color: 'bg-rose-950 text-rose-300 border-rose-800' },
    FLOOD: { label: 'Flood / Inundation', color: 'bg-sky-950 text-sky-300 border-sky-800' },
    FIRE: { label: 'Fire', color: 'bg-orange-950 text-orange-300 border-orange-800' },
    RESCUE: { label: 'Trapped / Rescue', color: 'bg-red-950 text-red-300 border-red-800' },
    MISSING_PERSONS: { label: 'Missing Person', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
    FOOD_WATER: { label: 'Food & Rations', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    INFRASTRUCTURE: { label: 'Infrastructure', color: 'bg-stone-900 text-stone-300 border-stone-700' },
    OTHER: { label: 'Other', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  };
  const item = map[category] || map['OTHER'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${item.color}`}>
      {item.label}
    </span>
  );
};
