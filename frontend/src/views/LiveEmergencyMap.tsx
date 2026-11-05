import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Filter,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Users,
  Eye,
  Shield,
  Layers,
} from 'lucide-react';
import { EmergencyRequest, Responder } from '../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/EmergencyBadge';

interface LiveEmergencyMapProps {
  emergencies: EmergencyRequest[];
  responders: Responder[];
  onSelectEmergency: (req: EmergencyRequest) => void;
}

export const LiveEmergencyMap: React.FC<LiveEmergencyMapProps> = ({
  emergencies,
  responders,
  onSelectEmergency,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<EmergencyRequest | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around disaster zone (Visakhapatnam coastal belt)
    const map = L.map(mapContainerRef.current, {
      center: [17.7234, 83.3012],
      zoom: 12,
      zoomControl: true,
    });

    // Dark-themed or high-contrast tile layer for emergency operations command
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | RESQ-NET Disaster Map',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when emergencies, responders, or filters change
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Plot Emergencies
    const filteredEmergencies = emergencies.filter((e) => {
      if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
      return e.latitude && e.longitude;
    });

    filteredEmergencies.forEach((req) => {
      if (!req.latitude || !req.longitude) return;

      const isCritical = req.priority === 'CRITICAL';
      const isHigh = req.priority === 'HIGH';
      const markerColor = isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#3b82f6';

      // Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-emergency-pin',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${isCritical ? '<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: ${markerColor};
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
              color: white;
              font-weight: 900;
              font-size: 11px;
            ">
              !
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([req.latitude, req.longitude], { icon: customIcon });

      marker.on('click', () => {
        setSelectedIncident(req);
      });

      // Accuracy confidence circle
      const radiusMeters = req.location_type === 'GPS_EXACT' ? 80 : 450;
      const circle = L.circle([req.latitude, req.longitude], {
        radius: radiusMeters,
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: req.location_type === 'GPS_EXACT' ? 0.25 : 0.12,
        weight: 1,
      });

      marker.addTo(markersLayerRef.current!);
      circle.addTo(markersLayerRef.current!);
    });

    // Auto-center map on the most recent real incident with coordinates
    if (filteredEmergencies.length > 0) {
      const latest = filteredEmergencies[0];
      if (latest.latitude && latest.longitude) {
        mapInstanceRef.current.panTo([latest.latitude, latest.longitude], { animate: true });
      }
    }
    responders.forEach((resp) => {
      if (!resp.current_latitude || !resp.current_longitude) return;

      const responderIcon = L.divIcon({
        className: 'custom-responder-pin',
        html: `
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 6px;
            background: #10b981;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.4);
            color: white;
            font-size: 11px;
          ">
            🛡️
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([resp.current_latitude, resp.current_longitude], {
        icon: responderIcon,
      }).bindPopup(`
        <div style="color: #0f172a; font-size: 12px; font-family: sans-serif;">
          <strong>${resp.name}</strong><br/>
          Type: ${resp.team_type}<br/>
          Status: <b>${resp.status}</b><br/>
          Phone: ${resp.phone}
        </div>
      `);

      marker.addTo(markersLayerRef.current!);
    });
  }, [emergencies, responders, categoryFilter, statusFilter]);

  const missingLocEmergencies = emergencies.filter((e) => e.is_location_missing);

  return (
    <div className="relative h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Map Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 px-6 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-semibold">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Category:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Categories</option>
            <option value="MEDICAL">Medical</option>
            <option value="FLOOD">Flood</option>
            <option value="FIRE">Fire</option>
            <option value="RESCUE">Rescue</option>
            <option value="FOOD_WATER">Food & Water</option>
          </select>

          <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-semibold ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New (Unverified)</option>
            <option value="VERIFIED">Verified</option>
            <option value="RESPONDER_ASSIGNED">Responder Assigned</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-300">Critical</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">High</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-slate-300">Medium</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-300">Field Responder</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Selected Incident Drawer on the Map */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-base text-white">{selectedIncident.id}</span>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <PriorityBadge priority={selectedIncident.priority} />
              <CategoryBadge category={selectedIncident.category} />
              <StatusBadge status={selectedIncident.status} />
            </div>

            <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              {selectedIncident.ai_summary || selectedIncident.raw_message}
            </div>

            <div className="text-[11px] space-y-1 text-slate-400 font-mono">
              <div>Phone: <strong className="text-slate-200">{selectedIncident.sender_phone}</strong></div>
              <div>Location: <strong className="text-slate-200">{selectedIncident.location_name || 'Exact GPS'}</strong></div>
              <div>Coordinates: {selectedIncident.latitude?.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}</div>
              <div>Affected: {selectedIncident.affected_count} people</div>
            </div>

            <button
              onClick={() => onSelectEmergency(selectedIncident)}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open Incident Dispatcher</span>
            </button>
          </div>
        )}

        {/* Missing Location Quick Drawer (Bottom Left Floating) */}
        {missingLocEmergencies.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10 max-w-sm bg-slate-900/95 border border-rose-800/80 rounded-xl p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold pb-2 border-b border-rose-900/50">
              <AlertTriangle className="w-4 h-4" />
              <span>{missingLocEmergencies.length} SMS Missing GPS/Landmark</span>
            </div>
            <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {missingLocEmergencies.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectEmergency(m)}
                  className="text-xs p-1.5 bg-slate-950/70 hover:bg-slate-800 rounded flex justify-between items-center cursor-pointer text-slate-300"
                >
                  <span className="font-mono text-rose-300">{m.id}</span>
                  <span className="truncate max-w-[180px] text-[11px] text-slate-400">{m.raw_message}</span>
                  <span className="text-[10px] text-blue-400 font-mono">Triage →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
