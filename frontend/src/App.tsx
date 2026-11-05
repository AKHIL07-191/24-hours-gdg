import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { OverviewDashboard } from './views/OverviewDashboard';
import { LiveEmergencyMap } from './views/LiveEmergencyMap';
import { EmergencyRequestsView } from './views/EmergencyRequestsView';
import { ResponderManagementView } from './views/ResponderManagementView';
import { GatewayMonitorView } from './views/GatewayMonitorView';
import { CommunicationHistoryView } from './views/CommunicationHistoryView';
import { ImageGalleryView } from './views/ImageGalleryView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { EmergencyRequest, Responder, AnalyticsSummary } from './types';
import { api } from './services/api';

const MainLayout: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Shared Data States
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyRequest | null>(null);

  const fetchAllData = async () => {
    try {
      const [emList, respList, anal] = await Promise.all([
        api.getEmergencies(),
        api.getResponders(),
        api.getAnalytics().catch(() => null),
      ]);
      setEmergencies(emList);
      setResponders(respList);
      if (anal) setAnalytics(anal);

      // Keep selectedEmergency in sync with updated list
      if (selectedEmergency) {
        const found = emList.find((e) => e.id === selectedEmergency.id);
        if (found) setSelectedEmergency(found);
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 10000); // 10s polling
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
          <span>CONNECTING TO RESQ-NET COMMAND SYSTEM...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const newRequestsCount = emergencies.filter((e) => e.status === 'NEW').length;

  const handleSelectEmergencyFromAnywhere = (req: EmergencyRequest) => {
    setSelectedEmergency(req);
    setActiveTab('requests');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar onRefreshAll={fetchAllData} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          newRequestsCount={newRequestsCount}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'overview' && (
            <OverviewDashboard
              emergencies={emergencies}
              analytics={analytics}
              onSelectEmergency={handleSelectEmergencyFromAnywhere}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'map' && (
            <LiveEmergencyMap
              emergencies={emergencies}
              responders={responders}
              onSelectEmergency={handleSelectEmergencyFromAnywhere}
            />
          )}

          {activeTab === 'requests' && (
            <EmergencyRequestsView
              emergencies={emergencies}
              responders={responders}
              selectedEmergency={selectedEmergency}
              onSelectEmergency={setSelectedEmergency}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'responders' && (
            <ResponderManagementView
              responders={responders}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'gateway' && (
            <GatewayMonitorView onRefresh={fetchAllData} />
          )}

          {activeTab === 'comms' && (
            <CommunicationHistoryView />
          )}

          {activeTab === 'multimedia' && (
            <ImageGalleryView
              emergencies={emergencies}
              onSelectEmergency={handleSelectEmergencyFromAnywhere}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView analytics={analytics} />
          )}

          {activeTab === 'settings' && (
            <SettingsView onRefreshAll={fetchAllData} />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
