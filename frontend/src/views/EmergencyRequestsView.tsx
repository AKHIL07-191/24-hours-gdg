import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Send,
  Edit,
  UserCheck,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Save,
  MessageSquare
} from 'lucide-react';
import { EmergencyRequest, Responder } from '../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/EmergencyBadge';
import { api } from '../services/api';

interface EmergencyRequestsViewProps {
  emergencies: EmergencyRequest[];
  responders: Responder[];
  selectedEmergency: EmergencyRequest | null;
  onSelectEmergency: (req: EmergencyRequest | null) => void;
  onRefresh: () => void;
}

export const EmergencyRequestsView: React.FC<EmergencyRequestsViewProps> = ({
  emergencies,
  responders,
  selectedEmergency,
  onSelectEmergency,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal / Action states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EmergencyRequest>>({});
  const [verifyNotes, setVerifyNotes] = useState('');
  const [selectedResponderId, setSelectedResponderId] = useState<number | ''>('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [manualSmsText, setManualSmsText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const filtered = emergencies.filter((req) => {
    if (categoryFilter !== 'ALL' && req.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && req.priority !== priorityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        req.id.toLowerCase().includes(q) ||
        req.sender_phone.includes(q) ||
        req.raw_message.toLowerCase().includes(q) ||
        (req.location_name && req.location_name.toLowerCase().includes(q)) ||
        (req.ai_summary && req.ai_summary.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedEmergency) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      await api.verifyEmergency(selectedEmergency.id, status, verifyNotes);
      setActionFeedback(`Request marked as ${status}. Automatic SMS dispatched.`);
      setVerifyNotes('');
      onRefresh();
    } catch (err: any) {
      alert(`Error verifying: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignResponder = async () => {
    if (!selectedEmergency || !selectedResponderId) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      await api.assignResponder(selectedEmergency.id, Number(selectedResponderId), dispatchNotes);
      setActionFeedback('Responder unit successfully assigned & victim notified via SMS.');
      setDispatchNotes('');
      setSelectedResponderId('');
      onRefresh();
    } catch (err: any) {
      alert(`Error assigning responder: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendManualSMS = async () => {
    if (!selectedEmergency || !manualSmsText.trim()) return;
    setActionLoading(true);
    try {
      await api.sendManualSMS(selectedEmergency.id, manualSmsText.trim());
      setActionFeedback('Custom operator SMS queued for cellular gateway delivery.');
      setManualSmsText('');
      onRefresh();
    } catch (err: any) {
      alert(`Error sending SMS: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = () => {
    if (!selectedEmergency) return;
    setEditForm({
      category: selectedEmergency.category,
      priority: selectedEmergency.priority,
      affected_count: selectedEmergency.affected_count,
      location_name: selectedEmergency.location_name,
      latitude: selectedEmergency.latitude,
      longitude: selectedEmergency.longitude,
      medical_concerns: selectedEmergency.medical_concerns,
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!selectedEmergency) return;
    setActionLoading(true);
    try {
      await api.updateEmergency(selectedEmergency.id, editForm);
      setIsEditing(false);
      setActionFeedback('Emergency details updated successfully.');
      onRefresh();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Column: Filterable List */}
      <div className={`flex-1 flex flex-col border-r border-slate-800 ${selectedEmergency ? 'hidden md:flex' : 'flex'}`}>
        {/* Filters and Search Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ID (DR-1042), phone, landmark, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-300"
            >
              <option value="ALL">All Categories</option>
              <option value="MEDICAL">Medical</option>
              <option value="FLOOD">Flood</option>
              <option value="FIRE">Fire</option>
              <option value="RESCUE">Rescue</option>
              <option value="FOOD_WATER">Food & Water</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New (Unverified)</option>
              <option value="VERIFIED">Verified</option>
              <option value="RESPONDER_ASSIGNED">Assigned</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-300"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No emergency requests match current filters.
            </div>
          ) : (
            filtered.map((req) => {
              const isSelected = selectedEmergency?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => {
                    onSelectEmergency(req);
                    setIsEditing(false);
                    setActionFeedback(null);
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer transition flex flex-col space-y-2 ${
                    isSelected
                      ? 'bg-red-950/30 border border-red-700/60'
                      : 'hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-sm text-white">{req.id}</span>
                      <PriorityBadge priority={req.priority} />
                      <CategoryBadge category={req.category} />
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  <div className="text-xs text-slate-300 line-clamp-2">
                    {req.ai_summary || req.raw_message}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{req.sender_phone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(req.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Detailed Emergency Dispatch Drawer */}
      {selectedEmergency ? (
        <div className="w-full md:w-[540px] lg:w-[620px] bg-slate-900 overflow-y-auto flex flex-col border-l border-slate-800">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <span className="font-mono font-black text-lg text-white">{selectedEmergency.id}</span>
              <PriorityBadge priority={selectedEmergency.priority} />
              <StatusBadge status={selectedEmergency.status} />
            </div>
            <button
              onClick={() => onSelectEmergency(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Feedback notification */}
            {actionFeedback && (
              <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs rounded-lg font-medium flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionFeedback}</span>
              </div>
            )}

            {/* AI Summary and Multilingual Section */}
            <div className="bg-slate-950/80 border border-blue-900/40 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span>AI EMERGENCY INTELLIGENCE BRIEF</span>
                </div>
                {selectedEmergency.is_ai_fallback ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800">
                    DETERMINISTIC FALLBACK
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    GEMINI PARSED ({Math.round(selectedEmergency.ai_confidence * 100)}%)
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-200 leading-relaxed font-sans">
                {selectedEmergency.ai_summary}
              </div>

              {selectedEmergency.ai_language_detected && selectedEmergency.ai_language_detected !== 'English' && (
                <div className="text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-300 space-y-1">
                  <div className="font-semibold text-amber-400">
                    Detected Regional Language: {selectedEmergency.ai_language_detected}
                  </div>
                  <div>Translated: "{selectedEmergency.ai_translated_text}"</div>
                </div>
              )}
            </div>

            {/* Raw SMS Data */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Cellular Inbound SMS Telemetry
              </div>
              <div className="bg-slate-900 p-3 rounded font-mono text-xs text-amber-300 break-words border border-slate-800">
                "{selectedEmergency.raw_message}"
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                <div>Format: <strong className="text-slate-200">{selectedEmergency.message_format}</strong></div>
                <div>Sender: <strong className="text-slate-200">{selectedEmergency.sender_phone}</strong></div>
                <div>Gateway: <strong className="text-slate-200">{selectedEmergency.gateway_id || 'N/A'}</strong></div>
                <div>SMS Time: <strong className="text-slate-200">{new Date(selectedEmergency.sms_received_at).toLocaleTimeString()}</strong></div>
              </div>
            </div>

            {/* Location & Coordinates Details */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span>LOCATION INTELLIGENCE</span>
                </div>
                {!isEditing && (
                  <button
                    onClick={startEdit}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Location / Data</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Landmark / Area Name:</label>
                    <input
                      type="text"
                      value={editForm.location_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Latitude:</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={editForm.latitude || ''}
                        onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Longitude:</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={editForm.longitude || ''}
                        onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center space-x-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {selectedEmergency.is_location_missing ? (
                    <div className="p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-xs">
                      ⚠️ Location missing in original message. Prompt sent to victim asking for landmark.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                      <div>Name: <strong className="text-white">{selectedEmergency.location_name || 'Exact GPS'}</strong></div>
                      <div>Type: <strong className="text-white">{selectedEmergency.location_type}</strong></div>
                      <div>Lat: <strong className="text-white">{selectedEmergency.latitude?.toFixed(4) || 'N/A'}</strong></div>
                      <div>Lng: <strong className="text-white">{selectedEmergency.longitude?.toFixed(4) || 'N/A'}</strong></div>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    Vulnerabilities: <span className="text-amber-300">{selectedEmergency.medical_concerns || 'None reported'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Operator Actions: Verification & Responder Assignment */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Operator Action & Dispatch Control
              </div>

              {/* Step 1: Human Verification */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Operator Verification Notes:</label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Record verification details (e.g. coordinates cross-verified with flood maps, phone callback attempted)..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerify('VERIFIED')}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm & Verify Request</span>
                  </button>
                  <button
                    onClick={() => handleVerify('REJECTED')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Responder Assignment */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <label className="text-xs text-slate-400 block font-semibold">Assign Responder Team:</label>
                <select
                  value={selectedResponderId}
                  onChange={(e) => setSelectedResponderId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Field Team...</option>
                  {responders.map((resp) => (
                    <option key={resp.id} value={resp.id}>
                      {resp.name} ({resp.team_type}) — Status: {resp.status}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Dispatch instructions (e.g. deploy inflatable boats from northern bank)..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-500"
                />
                <button
                  onClick={handleAssignResponder}
                  disabled={actionLoading || !selectedResponderId}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Dispatch Responder Unit & Send Victim SMS</span>
                </button>
              </div>

              {/* Step 3: Manual SMS Update */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <label className="text-xs text-slate-400 block">Transmit Direct SMS to Victim:</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Short SMS update (max 120 chars)..."
                    value={manualSmsText}
                    onChange={(e) => setManualSmsText(e.target.value)}
                    maxLength={120}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleSendManualSMS}
                    disabled={actionLoading || !manualSmsText.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:text-slate-600 text-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-950/40 text-slate-500 text-xs font-mono p-8 text-center">
          <div>
            <ShieldAlert className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <div>Select an emergency incident from the stream to verify, edit coordinates, or dispatch responder teams.</div>
          </div>
        </div>
      )}
    </div>
  );
};
