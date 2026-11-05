import React, { useState } from 'react';
import { Settings, Shield, Key, Database, RefreshCw, CheckCircle2, Lock, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SettingsView: React.FC<{ onRefreshAll: () => void }> = ({ onRefreshAll }) => {
  const { user } = useAuth();
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeedData = async () => {
    setSeedLoading(true);
    try {
      await api.seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      onRefreshAll();
    } catch (e: any) {
      alert(`Seed failed: ${e.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-slate-400" />
          <span>System Settings & Operational Security</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure security protocols, privacy masking, and platform diagnostic controls.
        </p>
      </div>

      {/* User Session & Role Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Active Authenticated Session</span>
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <div>Email: <strong className="text-slate-200">{user?.email}</strong></div>
          <div>Role: <strong className="text-red-400">{user?.role}</strong></div>
          <div>Name: <strong className="text-slate-200">{user?.full_name}</strong></div>
          <div>Security Token: <span className="text-emerald-400 font-bold">ACTIVE (24H EXPIRY)</span></div>
        </div>
      </div>

      {/* Privacy & Phone Number Masking Policy */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-blue-400" />
          <span>Victim Privacy & Phone Number Masking (GDPR / DPDP Compliant)</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          RESQ-NET enforces role-based column-level redaction. Authorized <strong>Emergency Operators</strong> and <strong>Administrators</strong> view full phone numbers to coordinate voice callbacks, while <strong>Read-Only Analysts</strong> and export logs automatically receive masked numbers (e.g., <code className="text-amber-400 font-mono">+91 98480*****</code>) to protect victim identity.
        </p>
      </div>

      {/* Database Diagnostic & Seed Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Demonstration Dataset Reset</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Seeds realistic emergency reports, Telugu & Hindi messages, and NDRF teams for testing.
            </p>
          </div>
          <button
            onClick={handleSeedData}
            disabled={seedLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{seedLoading ? 'Seeding...' : 'Seed Demo Data'}</span>
          </button>
        </div>

        {seedSuccess && (
          <div className="p-3 bg-emerald-950 border border-emerald-700 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Demo dataset seeded successfully!</span>
          </div>
        )}
      </div>

      {/* Important Technical Constraints Callout */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-2">
        <div className="text-xs font-bold text-amber-400 font-mono">
          IMPORTANT TECHNICAL CONSTRAINT & ARCHITECTURAL BOUNDARY
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          RESQ-NET cannot bypass a complete cellular radio outage where all cellular towers have lost power or backhaul. The originating handset still requires a cellular path to deliver SMS to the local gateway SIM. Cellular SMS works in disaster zones because SMS uses signaling control channels (SS7 / 3GPP SMSC) which survive severe congestion and packet loss when 4G/5G mobile data fails.
        </p>
      </div>
    </div>
  );
};
