import React from 'react';
import {
  AlertTriangle,
  Radio,
  CheckCircle2,
  Users,
  Clock,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { EmergencyRequest, AnalyticsSummary } from '../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/EmergencyBadge';

interface OverviewDashboardProps {
  emergencies: EmergencyRequest[];
  analytics: AnalyticsSummary | null;
  onSelectEmergency: (req: EmergencyRequest) => void;
  onNavigateTab: (tab: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  emergencies,
  analytics,
  onSelectEmergency,
  onNavigateTab,
}) => {
  const kpis = analytics?.kpis || {
    total_requests: emergencies.length,
    new_requests: emergencies.filter((e) => e.status === 'NEW').length,
    pending_verification: emergencies.filter((e) => e.status === 'NEW').length,
    verified_requests: emergencies.filter((e) => e.status === 'VERIFIED').length,
    assigned_responders: emergencies.filter((e) => e.status === 'RESPONDER_ASSIGNED').length,
    in_progress: emergencies.filter((e) => e.status === 'IN_PROGRESS').length,
    resolved_requests: emergencies.filter((e) => e.status === 'RESOLVED').length,
    rejected_requests: emergencies.filter((e) => e.status === 'REJECTED').length,
    missing_location_count: emergencies.filter((e) => e.is_location_missing).length,
    available_responders: 5,
    dispatched_responders: 1,
    total_responders: 6,
  };

  const criticalEmergencies = emergencies.filter(
    (e) => e.priority === 'CRITICAL' && e.status !== 'RESOLVED' && e.status !== 'REJECTED'
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Critical Banner Alert if any critical emergencies */}
      {criticalEmergencies.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border border-red-700/80 rounded-xl p-4 flex items-center justify-between shadow-xl shadow-red-950/50">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center animate-pulse">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-red-200">
                CRITICAL LIFE-SAFETY ALERT ({criticalEmergencies.length} ACTIVE)
              </div>
              <div className="text-xs text-red-300">
                Immediate threat to life: trapped victims, structural fire, or severe medical trauma requiring human dispatcher review.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('requests')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-red-950"
          >
            <span>Review Critical Incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Incidents</div>
          <div className="text-2xl font-black text-white mt-1">{kpis.total_requests}</div>
          <div className="text-[10px] text-slate-500 mt-1">SMS Ingested</div>
        </div>

        <div className="bg-slate-900/80 border border-purple-900/40 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-purple-400 uppercase">New / Untriaged</div>
          <div className="text-2xl font-black text-purple-300 mt-1">{kpis.new_requests}</div>
          <div className="text-[10px] text-purple-400/70 mt-1">Awaiting Operator</div>
        </div>

        <div className="bg-slate-900/80 border border-blue-900/40 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-blue-400 uppercase">Verified</div>
          <div className="text-2xl font-black text-blue-300 mt-1">{kpis.verified_requests}</div>
          <div className="text-[10px] text-blue-400/70 mt-1">Confirmed Incidents</div>
        </div>

        <div className="bg-slate-900/80 border border-amber-900/40 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-amber-400 uppercase">Field Assigned</div>
          <div className="text-2xl font-black text-amber-300 mt-1">{kpis.assigned_responders}</div>
          <div className="text-[10px] text-amber-400/70 mt-1">NDRF / SDRF En Route</div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-900/40 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-emerald-400 uppercase">Resolved</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{kpis.resolved_requests}</div>
          <div className="text-[10px] text-emerald-400/70 mt-1">Rescued / Stabilized</div>
        </div>

        <div className="bg-slate-900/80 border border-rose-900/40 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-rose-400 uppercase">Missing Location</div>
          <div className="text-2xl font-black text-rose-300 mt-1">{kpis.missing_location_count}</div>
          <div className="text-[10px] text-rose-400/70 mt-1">Needs Pinpoint</div>
        </div>
      </div>

      {/* Main Grid: Active Incidents Stream & Responders / Gateway Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Emergency Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Live Disaster Emergency Feed
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('requests')}
              className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
            >
              <span>View All ({emergencies.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {emergencies.slice(0, 6).map((req) => (
              <div
                key={req.id}
                onClick={() => onSelectEmergency(req)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  req.priority === 'CRITICAL'
                    ? 'bg-red-950/20 border-red-800/60 hover:border-red-600'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-slate-100">{req.id}</span>
                    <PriorityBadge priority={req.priority} />
                    <CategoryBadge category={req.category} />
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(req.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 line-clamp-2">
                  {req.ai_summary || req.raw_message}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {req.is_location_missing ? (
                        <span className="text-rose-400 font-bold">⚠️ Location Missing in SMS</span>
                      ) : (
                        <span>{req.location_name || `${req.latitude?.toFixed(4)}, ${req.longitude?.toFixed(4)}`}</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 font-mono">
                    <span>Affected: <strong className="text-slate-200">{req.affected_count}</strong></span>
                    {req.ai_language_detected && req.ai_language_detected !== 'English' && (
                      <span className="text-amber-400 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{req.ai_language_detected}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1 Col): Gateway & Tactical Units Quick Summary */}
        <div className="space-y-6">
          {/* SMS Gateway Operational Health */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Cellular Gateway Node</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                ONLINE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Connected SIM Device:</span>
                <span className="font-mono text-slate-200">Android Node 01 (SIM 1)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Inbound SMS Received:</span>
                <span className="font-mono text-emerald-400 font-bold">{analytics?.sms_traffic?.inbound_total || 5}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Outbound Acks Sent:</span>
                <span className="font-mono text-blue-400 font-bold">{analytics?.sms_traffic?.sent_outbound || 5}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Local Queue Store-Forward:</span>
                <span className="font-mono text-emerald-400">0 PENDING (HEALTHY)</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('gateway')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg transition"
            >
              Open Gateway & Chaos Simulator →
            </button>
          </div>

          {/* Quick Responders Snapshot */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Field Responder Teams</h3>
              </div>
              <button
                onClick={() => onNavigateTab('responders')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">NDRF Coastal Rescue Boat Alpha</div>
                  <div className="text-[10px] text-slate-400">Vizag Harbor Staging Point</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  AVAILABLE
                </span>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Rapid Trauma Medical Evac Unit 1</div>
                  <div className="text-[10px] text-slate-400">King George Hospital Base</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                  DISPATCHED
                </span>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Disaster Fire & Hazmat Brigade 3</div>
                  <div className="text-[10px] text-slate-400">Dwaraka Nagar Fire Hub</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  AVAILABLE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
