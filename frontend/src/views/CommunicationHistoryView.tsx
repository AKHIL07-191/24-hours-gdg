import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { SMSMessage, AuditLog } from '../types';
import { api } from '../services/api';

export const CommunicationHistoryView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'sms' | 'audit'>('sms');
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [smsList, auditList] = await Promise.all([
        api.getSMSHistory(),
        api.getAuditLogs(),
      ]);
      setMessages(smsList);
      setAuditLogs(auditList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(true);
    const refreshTimer = window.setInterval(() => {
      void loadData();
    }, 5000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const filteredSMS = messages.filter((m) => {
    if (directionFilter !== 'ALL' && m.direction !== directionFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        m.phone_number.includes(q) ||
        m.message_text.toLowerCase().includes(q) ||
        (m.emergency_request_id && m.emergency_request_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <span>Two-Way SMS Communication & System Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inbound phone messages and outbound replies. New messages refresh automatically every 5 seconds.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex space-x-1 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('sms')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'sms'
                ? 'bg-red-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cellular SMS Logs ({messages.length})
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'audit'
                ? 'bg-red-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Security Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'sms' ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by phone number, message text, or Request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Direction:</span>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              >
                <option value="ALL">All Directions</option>
                <option value="INBOUND">Inbound (From Victim)</option>
                <option value="OUTBOUND">Outbound (Acks & Updates)</option>
              </select>
            </div>
          </div>

          {/* SMS Stream Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Message Body</th>
                    <th className="py-3 px-4">Incident ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
                  {filteredSMS.map((sms) => {
                    const isInbound = sms.direction === 'INBOUND';
                    return (
                      <tr key={sms.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono">
                          {isInbound ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              <span>INBOUND</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-blue-400 font-bold">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>OUTBOUND</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">{sms.phone_number}</td>
                        <td className="py-3 px-4 max-w-md break-words text-slate-200">
                          {sms.message_text}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-red-400">
                          {sms.emergency_request_id || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sms.status === 'DELIVERED' || sms.status === 'SENT'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : sms.status === 'RECEIVED'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {sms.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(sms.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Trail */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Operator / Principal</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Audit Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-blue-400">{log.user_email || 'SYSTEM'}</td>
                  <td className="py-3 px-4 font-bold text-slate-200">{log.action}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.resource_type} {log.resource_id ? `[${log.resource_id}]` : ''}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-sm truncate">{log.details}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
