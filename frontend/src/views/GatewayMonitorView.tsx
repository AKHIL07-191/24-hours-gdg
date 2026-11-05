import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Send,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Smartphone,
  Server,
  Layers,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';

export const GatewayMonitorView: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  // Simulator State
  const [isGatewayOnline, setIsGatewayOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<Array<{ id: string; sender: string; text: string; timestamp: string }>>([]);
  const [simLog, setSimLog] = useState<string[]>([
    'System initialized. Android Gateway Node #01 listening on GSM Band 3/40.',
    'Store-and-forward persistent engine armed.',
  ]);

  // SMS Composer
  const [senderPhone, setSenderPhone] = useState('+919848099112');
  const [smsText, setSmsText] = useState('HELP|MED|17.7234,83.3012|2INJ|LOWBAT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLog = (msg: string) => {
    setSimLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 40)]);
  };

  const handleSendSMS = async () => {
    if (!smsText.trim()) return;
    setIsSubmitting(true);
    const msgId = `sim_${Date.now()}`;

    if (!isGatewayOnline) {
      // Simulate offline caching inside SQLite queue
      const offlineMsg = {
        id: msgId,
        sender: senderPhone,
        text: smsText,
        timestamp: new Date().toISOString(),
      };
      setOfflineQueue((prev) => [...prev, offlineMsg]);
      addLog(`⚠️ [OFFLINE STORE-AND-FORWARD] Internet down at Gateway. Message ${msgId} written to local SQLite queue. Total cached: ${offlineQueue.length + 1}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.sendInboundSMS(senderPhone, smsText, msgId);
      if (res.status === 'DUPLICATE_SUPPRESSED') {
        addLog(`🔄 [DUPLICATE SUPPRESSED] Idempotent engine caught repeat message ${msgId}. Existing ID: ${res.request_id}`);
      } else {
        addLog(`✅ [INGESTED ONLINE] Request ${res.request_id} created. Priority: ${res.priority}. Outbound acknowledgement queued.`);
      }
      onRefresh();
    } catch (err: any) {
      addLog(`❌ [ERROR] Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleOnline = () => {
    const nextState = !isGatewayOnline;
    setIsGatewayOnline(nextState);
    if (!nextState) {
      addLog('🔴 [CHAOS TRIGGERED] Disconnected internet backhaul at Gateway! Uplink to central server severed.');
    } else {
      addLog('🟢 [RECONNECT] Gateway internet restored. Cellular data link established with central server.');
    }
  };

  const handleFlushQueue = async () => {
    if (offlineQueue.length === 0) {
      addLog('Local queue is empty. No offline messages to flush.');
      return;
    }
    addLog(`🚀 [BATCH SYNC TRIGGERED] Transmitting ${offlineQueue.length} cached offline messages to central server...`);
    try {
      const res = await api.syncBatchSMS(
        offlineQueue.map((m) => ({
          message_id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
        }))
      );
      addLog(`🎉 [SYNC COMPLETE] Batch processed: ${res.processed_count} new incidents created, ${res.duplicate_count} duplicates suppressed.`);
      setOfflineQueue([]);
      onRefresh();
    } catch (err: any) {
      addLog(`❌ [BATCH SYNC FAILED] ${err.message}`);
    }
  };

  const handleLoadSample = (sample: string, phone: string = '+919848099112') => {
    setSmsText(sample);
    setSenderPhone(phone);
  };

  const handleGetRealGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSmsText(`HELP|MED|${lat.toFixed(4)},${lng.toFixed(4)}|URGENT RESCUE`);
          addLog(`📍 [REAL DEVICE GPS ACQUIRED] Satellite Fix: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Accuracy: ${pos.coords.accuracy.toFixed(0)}m)`);
        },
        (err) => {
          alert('GPS Error: ' + err.message + '. Please allow location access in your browser.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by this device.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Radio className="w-6 h-6 text-emerald-400" />
          <span>Android SMS Gateway & Network Chaos Simulator</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Forward real SMS received by an Android phone to this laptop, or use the simulator to test outage recovery.
        </p>
      </div>

      <section className="bg-blue-950/40 border border-blue-800/70 rounded-xl p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-blue-300" />
          <h2 className="text-sm font-bold text-white">Connect an Android phone to this laptop</h2>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
          <li>Put the Android gateway phone and laptop on the same trusted Wi-Fi network. The gateway phone needs an active SIM; other phones send SMS to that SIM.</li>
          <li>On Windows, run <code className="text-blue-200">ipconfig</code> and note the laptop's Wi-Fi IPv4 address. Allow Python/backend traffic on port 8000 on private networks if Windows Firewall asks.</li>
          <li>Install an SMS-forwarding app on Android, grant its SMS and background-network permissions, and configure its incoming-message webhook:</li>
        </ol>
        <div className="bg-slate-950/80 rounded-lg p-3 font-mono text-[11px] text-slate-200 space-y-1 break-all">
          <div>Method: POST</div>
          <div>URL: http://&lt;LAPTOP_WIFI_IPV4&gt;:8000/api/v1/sms/inbound</div>
          <div>Header: X-Gateway-Key: &lt;GATEWAY_API_KEY from backend .env&gt;</div>
          <div>JSON body: {"{ \"sender\": \"%from%\", \"text\": \"%body%\", \"message_id\": \"%id%\", \"gateway_id\": \"ANDROID_GATEWAY_01\" }"}</div>
        </div>
        <p className="text-[11px] text-slate-400">
          Replace the URL placeholder with the laptop IPv4 address. New forwarded messages are processed and appear in Communication History; SMS arriving while the phone has no Wi-Fi need a forwarder app that queues and retries webhooks.
        </p>
      </section>

      {/* Hardware Architecture Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Victim Keypad Phone */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Victim Device</div>
            <div className="text-[11px] text-slate-400">Basic Keypad or Android Phone</div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Cellular GSM SMS Only</div>
          </div>
        </div>

        {/* Gateway Phone Node */}
        <div className={`border rounded-xl p-4 flex items-center justify-between transition ${
          isGatewayOnline ? 'bg-slate-900 border-slate-800' : 'bg-red-950/30 border-red-800/80'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isGatewayOnline ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
            }`}>
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Android Gateway Node #01</div>
              <div className="text-[11px] text-slate-400">Local SIM + Persistent SQLite Queue</div>
              <div className="text-[10px] font-mono mt-0.5">
                Backhaul: {isGatewayOnline ? <span className="text-emerald-400 font-bold">CONNECTED</span> : <span className="text-red-400 font-bold">OFFLINE</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Central Server */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-950 flex items-center justify-center flex-shrink-0 text-blue-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Central Operations Backend</div>
            <div className="text-[11px] text-slate-400">FastAPI + Gemini AI + Leaflet GIS</div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">Idempotent Deduplication Engine</div>
          </div>
        </div>
      </div>

      {/* Chaos Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Disaster Resilience & Network Chaos Simulator</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleOnline}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow ${
                isGatewayOnline
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isGatewayOnline ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Simulate Internet Blackout (Cut Link)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Restore Gateway Internet Uplink</span>
                </>
              )}
            </button>

            {!isGatewayOnline && offlineQueue.length > 0 && (
              <button
                onClick={handleFlushQueue}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Force Batch Sync ({offlineQueue.length} Queued)</span>
              </button>
            )}
          </div>
        </div>

        {/* Offline Queue Badge */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Local Gateway SQLite Queue:</span>
            <span className={`font-bold ${offlineQueue.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {offlineQueue.length} Messages Pending Sync
            </span>
          </div>
          {offlineQueue.length > 0 && (
            <span className="text-[10px] text-amber-300">
              Messages will automatically batch-sync when connectivity returns.
            </span>
          )}
        </div>
      </div>

      {/* Interactive SMS Injector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Test with the SMS Simulator</h3>
            <span className="text-[10px] text-slate-400 font-mono">Does not send a real SMS</span>
          </div>

          {/* Real GPS Fetch Button */}
          <div className="p-3 bg-blue-950/60 border border-blue-700/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">🛰️ Live Phone / Device GPS</span>
              <button
                type="button"
                onClick={handleGetRealGPS}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <span>📍 Get My Real Live GPS Location</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Captures your actual real-time satellite coordinates from your phone/laptop sensor with zero predefined data.
            </p>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400">Load disaster SMS presets:</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleLoadSample('HELP|MED|17.7234,83.3012|2INJ|LOWBAT', '+919848011221')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono"
              >
                Structured GPS & Injuries
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('HELP|FLOOD|VIZAG|4 PEOPLE|1 ELDERLY', '+919848022332')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono"
              >
                Flood Landmark & Elderly
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('HELP|FIRE|NEAR BUS STAND|TRAPPED', '+919848033443')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono"
              >
                Fire & Trapped
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('వరద నీరు ఇంట్లోకి వచ్చింది మా ఇంట్లో 3 మంది పిల్లలు ఉన్నారు కాపాడండి', '+919848044554')}
                className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 rounded border border-amber-800 font-mono"
              >
                Telugu Regional Language
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('छत गिर गई है 2 लोग मलबे में दबे हैं RK Beach के पास', '+919848055665')}
                className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 rounded border border-amber-800 font-mono"
              >
                Hindi Regional Language
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('HELP|FOOD|NO LOCATION|RATIONS EXHAUSTED', '+919848066776')}
                className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 font-mono"
              >
                Missing Location SMS
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Victim Phone Number (Simulated SIM):</label>
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">SMS Text Body:</label>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
              />
            </div>

            <button
              onClick={handleSendSMS}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition flex items-center justify-center space-x-2 shadow"
            >
              <Send className="w-4 h-4" />
              <span>
                {isGatewayOnline
                  ? 'Transmit SMS via Online Gateway'
                  : 'Transmit SMS to Offline Gateway (Queue Locally)'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Simulator Log Terminal */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col h-full font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Gateway Engine Telemetry & Chaos Log</span>
            </div>
            <button
              onClick={() => setSimLog([])}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 text-slate-300 text-[11px] pr-2 max-h-[320px]">
            {simLog.map((log, idx) => (
              <div key={idx} className="break-words leading-relaxed font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
