export type EmergencyCategory =
  | 'MEDICAL'
  | 'FLOOD'
  | 'FIRE'
  | 'RESCUE'
  | 'MISSING_PERSONS'
  | 'FOOD_WATER'
  | 'INFRASTRUCTURE'
  | 'OTHER';

export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EmergencyStatus =
  | 'NEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'RESPONDER_ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export type LocationType = 'GPS_EXACT' | 'LANDMARK_APPROX' | 'NETWORK_APPROX' | 'UNKNOWN';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'RESPONDER' | 'ANALYST';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface ImageEvidence {
  id: string;
  emergency_request_id?: string;
  filename: string;
  file_path: string;
  file_size_bytes: number;
  compressed: boolean;
  deferred_upload: boolean;
  caption?: string;
  uploaded_at: string;
}

export interface EmergencyRequest {
  id: string;
  sender_phone: string;
  raw_message: string;
  message_format: 'STRUCTURED' | 'NATURAL_LANGUAGE';
  category: EmergencyCategory;
  priority: EmergencyPriority;
  affected_count: number;
  medical_concerns?: string;
  details?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  location_type: LocationType;
  location_confidence: number;
  is_location_missing: boolean;
  status: EmergencyStatus;
  verification_notes?: string;
  verified_by_user_id?: number;
  verified_at?: string;
  assigned_responder_id?: number;
  assigned_at?: string;
  ai_processed: boolean;
  ai_category?: string;
  ai_priority?: string;
  ai_summary?: string;
  ai_confidence: number;
  ai_language_detected?: string;
  ai_translated_text?: string;
  is_ai_fallback: boolean;
  gateway_id?: string;
  client_message_id?: string;
  sms_received_at: string;
  sync_received_at: string;
  created_at: string;
  updated_at: string;
  images: ImageEvidence[];
}

export interface Responder {
  id: number;
  name: string;
  phone: string;
  team_type: 'MEDICAL' | 'RESCUE_BOAT' | 'FIRE_HAZMAT' | 'EVACUATION' | 'SUPPLIES';
  status: 'AVAILABLE' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'OFF_DUTY';
  base_location: string;
  current_latitude?: number;
  current_longitude?: number;
  created_at: string;
}

export interface SMSMessage {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  phone_number: string;
  message_text: string;
  status: 'RECEIVED' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  emergency_request_id?: string;
  gateway_id?: string;
  created_at: string;
  sent_at?: string;
}

export interface AuditLog {
  id: number;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  kpis: {
    total_requests: number;
    new_requests: number;
    pending_verification: number;
    verified_requests: number;
    assigned_responders: number;
    in_progress: number;
    resolved_requests: number;
    rejected_requests: number;
    missing_location_count: number;
    available_responders: number;
    dispatched_responders: number;
    total_responders: number;
  };
  by_category: { category: string; count: number }[];
  by_priority: { priority: string; count: number }[];
  by_status: { status: string; count: number }[];
  sms_traffic: {
    inbound_total: number;
    outbound_total: number;
    queued_outbound: number;
    sent_outbound: number;
    gateway_status: string;
    last_heartbeat: string;
  };
  ai_metrics: {
    ai_total_processed: number;
    gemini_api_processed: number;
    fallback_rule_processed: number;
    average_confidence: number;
  };
}
