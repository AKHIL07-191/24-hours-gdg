import React, { useState } from 'react';
import { Users, Plus, Shield, Phone, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { Responder } from '../types';
import { api } from '../services/api';

interface ResponderManagementViewProps {
  responders: Responder[];
  onRefresh: () => void;
}

export const ResponderManagementView: React.FC<ResponderManagementViewProps> = ({
  responders,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    phone: '',
    team_type: 'RESCUE_BOAT' as const,
    status: 'AVAILABLE' as const,
    base_location: 'Central Disaster Staging Hub',
    current_latitude: 17.7234,
    current_longitude: 83.3012,
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createResponder(newTeam);
      setShowAddModal(false);
      setNewTeam({
        name: '',
        phone: '',
        team_type: 'RESCUE_BOAT',
        status: 'AVAILABLE',
        base_location: 'Central Disaster Staging Hub',
        current_latitude: 17.7234,
        current_longitude: 83.3012,
      });
      onRefresh();
    } catch (err: any) {
      alert(`Error creating responder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, currentStatus: string) => {
    const nextStatusMap: Record<string, 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'OFF_DUTY'> = {
      AVAILABLE: 'DISPATCHED',
      DISPATCHED: 'ON_SCENE',
      ON_SCENE: 'AVAILABLE',
      OFF_DUTY: 'AVAILABLE',
    };
    const next = nextStatusMap[currentStatus] || 'AVAILABLE';
    try {
      await api.updateResponder(id, { status: next });
      onRefresh();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-500" />
            <span>Field Responder Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Coordinate NDRF, SDRF, Fire, and Medical emergency response units across the disaster zone.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Team</span>
        </button>
      </div>

      {/* Grid of Responders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {responders.map((resp) => {
          const isAvail = resp.status === 'AVAILABLE';
          const isDisp = resp.status === 'DISPATCHED';
          return (
            <div
              key={resp.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {resp.team_type}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      isAvail
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : isDisp
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    }`}
                  >
                    {resp.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-white mt-3">{resp.name}</h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-slate-200">{resp.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{resp.base_location}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 pt-1">
                    GPS: {resp.current_latitude?.toFixed(4)}, {resp.current_longitude?.toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">Status Action:</span>
                <button
                  onClick={() => handleStatusChange(resp.id, resp.status)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition"
                >
                  Set {resp.status === 'AVAILABLE' ? 'Dispatched' : resp.status === 'DISPATCHED' ? 'On Scene' : 'Available'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">Register Emergency Response Team</h2>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Team / Unit Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NDRF Water Rescue Platoon 2"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Contact Phone (Cellular SMS):</label>
                <input
                  type="text"
                  required
                  placeholder="+9198XXXXXXXX"
                  value={newTeam.phone}
                  onChange={(e) => setNewTeam({ ...newTeam, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Team Specialty:</label>
                  <select
                    value={newTeam.team_type}
                    onChange={(e: any) => setNewTeam({ ...newTeam, team_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    <option value="RESCUE_BOAT">Rescue Boat</option>
                    <option value="MEDICAL">Trauma Medical</option>
                    <option value="FIRE_HAZMAT">Fire & Hazmat</option>
                    <option value="EVACUATION">Evacuation</option>
                    <option value="SUPPLIES">Rations & Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Initial Status:</label>
                  <select
                    value={newTeam.status}
                    onChange={(e: any) => setNewTeam({ ...newTeam, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="OFF_DUTY">Off Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Base Staging Location:</label>
                <input
                  type="text"
                  value={newTeam.base_location}
                  onChange={(e) => setNewTeam({ ...newTeam, base_location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Register Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
