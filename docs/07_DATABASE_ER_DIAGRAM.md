# Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ EMERGENCY_REQUESTS : "verifies"
    RESPONDERS ||--o{ EMERGENCY_REQUESTS : "assigned_to"
    EMERGENCY_REQUESTS ||--o{ SMS_MESSAGES : "generates"
    EMERGENCY_REQUESTS ||--o{ IMAGE_EVIDENCE : "has_evidence"
    USERS ||--o{ AUDIT_LOGS : "performs"

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
    }

    EMERGENCY_REQUESTS {
        string id PK "e.g. DR-1042"
        string sender_phone
        text raw_message
        string message_format
        string category
        string priority
        int affected_count
        text medical_concerns
        text details
        string location_name
        float latitude
        float longitude
        string location_type
        float location_confidence
        boolean is_location_missing
        string status
        text verification_notes
        int verified_by_user_id FK
        datetime verified_at
        int assigned_responder_id FK
        datetime assigned_at
        boolean ai_processed
        string ai_category
        string ai_priority
        text ai_summary
        float ai_confidence
        string ai_language_detected
        text ai_translated_text
        boolean is_ai_fallback
        string gateway_id
        string client_message_id UK
        datetime sms_received_at
        datetime sync_received_at
        datetime created_at
        datetime updated_at
    }

    RESPONDERS {
        int id PK
        string name
        string phone
        string team_type
        string status
        string base_location
        float current_latitude
        float current_longitude
        datetime created_at
    }

    SMS_MESSAGES {
        string id PK
        string direction "INBOUND | OUTBOUND"
        string phone_number
        text message_text
        string status "RECEIVED | QUEUED | SENT | DELIVERED"
        string emergency_request_id FK
        string gateway_id
        datetime created_at
        datetime sent_at
    }

    IMAGE_EVIDENCE {
        string id PK
        string emergency_request_id FK
        string sender_phone
        string filename
        string file_path
        int file_size_bytes
        boolean compressed
        boolean deferred_upload
        text caption
        datetime uploaded_at
    }

    AUDIT_LOGS {
        int id PK
        string user_email
        string action
        string resource_type
        string resource_id
        text details
        string ip_address
        datetime timestamp
    }
```
