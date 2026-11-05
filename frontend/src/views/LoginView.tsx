import React, { useState } from 'react';
import { ShieldAlert, Lock, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('operator@resqnet.org');
  const [password, setPassword] = useState('operator123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setError(null);
    setLoading(true);
    try {
      await login(quickEmail);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background disaster emergency glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mx-auto shadow-xl shadow-red-900/40">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            RESQ<span className="text-red-500">-NET</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Disaster-Resilient Emergency Coordination System
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl text-red-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-medium">Operator Email:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">Access Password:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-red-950"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Operations Command'}</span>
          </button>
        </form>

        {/* One-Click Quick Role Switcher for seamless evaluation */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <div className="text-[11px] text-slate-400 font-mono text-center">
            Or select test role credentials:
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('operator@resqnet.org')}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
            >
              <div className="font-bold text-red-400">Emergency Operator</div>
              <div className="text-[10px] text-slate-500">Triage & Dispatch</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@resqnet.org')}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
            >
              <div className="font-bold text-blue-400">Chief Officer</div>
              <div className="text-[10px] text-slate-500">Full Administrative RBAC</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('responder@resqnet.org')}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
            >
              <div className="font-bold text-emerald-400">Field Responder</div>
              <div className="text-[10px] text-slate-500">NDRF Unit 4</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('analyst@resqnet.org')}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
            >
              <div className="font-bold text-purple-400">Read-Only Analyst</div>
              <div className="text-[10px] text-slate-500">Privacy Masked Feed</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
