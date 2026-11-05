import { EmergencyRequest, Responder, SMSMessage, AnalyticsSummary, User } from '../types';

const API_HOST = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
const API_BASE = `http://${API_HOST}:8000/api/v1`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('resqnet_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // Emergencies
  async getEmergencies(params?: {
    status?: string;
    category?: string;
    priority?: string;
    missing_location?: boolean;
    search?: string;
  }): Promise<EmergencyRequest[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.missing_location !== undefined) query.append('missing_location', String(params.missing_location));
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/emergencies?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load emergencies');
    return res.json();
  },

  async getEmergencyById(id: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/emergencies/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load emergency details');
    return res.json();
  },

  async updateEmergency(id: string, updates: Partial<EmergencyRequest>): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/emergencies/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update emergency');
    return res.json();
  },

  async verifyEmergency(id: string, status: 'VERIFIED' | 'REJECTED', notes: string, priority?: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/emergencies/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, verification_notes: notes, priority, send_sms_update: true }),
    });
    if (!res.ok) throw new Error('Failed to verify emergency');
    return res.json();
  },

  async assignResponder(id: string, responderId: number, notes?: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/emergencies/${id}/assign-responder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ responder_id: responderId, notes, notify_victim_via_sms: true }),
    });
    if (!res.ok) throw new Error('Failed to assign responder');
    return res.json();
  },

  async sendManualSMS(id: string, messageText: string) {
    const res = await fetch(`${API_BASE}/emergencies/${id}/send-sms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message_text: messageText }),
    });
    if (!res.ok) throw new Error('Failed to send SMS');
    return res.json();
  },

  // Responders
  async getResponders(): Promise<Responder[]> {
    const res = await fetch(`${API_BASE}/responders`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load responders');
    return res.json();
  },

  async createResponder(data: Omit<Responder, 'id' | 'created_at'>): Promise<Responder> {
    const res = await fetch(`${API_BASE}/responders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create responder');
    return res.json();
  },

  async updateResponder(id: number, updates: Partial<Responder>): Promise<Responder> {
    const res = await fetch(`${API_BASE}/responders/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update responder');
    return res.json();
  },

  // SMS Gateway & Store-Forward
  async sendInboundSMS(sender: string, text: string, messageId?: string) {
    const res = await fetch(`${API_BASE}/sms/inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Key': 'resqnet-gateway-token-secret'
      },
      body: JSON.stringify({
        message_id: messageId,
        sender,
        text,
        gateway_id: 'ANDROID_GATEWAY_01'
      })
    });
    if (!res.ok) throw new Error('Inbound SMS submission failed');
    return res.json();
  },

  async syncBatchSMS(messages: Array<{ message_id: string; sender: string; text: string; timestamp?: string }>) {
    const res = await fetch(`${API_BASE}/sms/sync-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Key': 'resqnet-gateway-token-secret'
      },
      body: JSON.stringify({
        gateway_id: 'ANDROID_GATEWAY_01',
        messages
      })
    });
    if (!res.ok) throw new Error('Batch sync failed');
    return res.json();
  },

  async getSMSHistory(): Promise<SMSMessage[]> {
    const res = await fetch(`${API_BASE}/sms/history`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load SMS history');
    return res.json();
  },

  // Analytics & System
  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/system/audit-logs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  async seedDemoData() {
    const res = await fetch(`${API_BASE}/system/seed-demo-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to seed demo data');
    return res.json();
  },

  // Multimedia Deferred Images
  async uploadImage(file: File, emergencyId?: string, senderPhone?: string, caption?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (emergencyId) formData.append('emergency_request_id', emergencyId);
    if (senderPhone) formData.append('sender_phone', senderPhone);
    if (caption) formData.append('caption', caption);
    formData.append('deferred_upload', 'true');

    const token = localStorage.getItem('resqnet_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    return res.json();
  },

  async listImages(emergencyId?: string) {
    const query = emergencyId ? `?emergency_request_id=${emergencyId}` : '';
    const res = await fetch(`${API_BASE}/images/list${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to list images');
    return res.json();
  }
};
