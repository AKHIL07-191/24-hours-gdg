import pytest
from backend.app.services.parser_service import EmergencyParserService

def test_structured_sms_with_gps_and_injuries():
    sms = "HELP|MED|17.7234,83.3012|2INJ|LOWBAT"
    parsed = EmergencyParserService.parse_sms(sms, "+919848011221")
    
    assert parsed["message_format"] == "STRUCTURED"
    assert parsed["category"] == "MEDICAL"
    assert parsed["priority"] == "CRITICAL"
    assert parsed["affected_count"] >= 2
    assert "2 Injured" in (parsed["medical_concerns"] or "")
    assert parsed["latitude"] == 17.7234
    assert parsed["longitude"] == 83.3012
    assert parsed["location_type"] == "GPS_EXACT"
    assert parsed["is_location_missing"] is False

def test_structured_sms_with_landmark_and_elderly():
    sms = "HELP|FLOOD|VIZAG|4 PEOPLE|1 ELDERLY"
    parsed = EmergencyParserService.parse_sms(sms, "+919848022332")
    
    assert parsed["message_format"] == "STRUCTURED"
    assert parsed["category"] == "FLOOD"
    assert parsed["priority"] in ["HIGH", "CRITICAL"]
    assert parsed["affected_count"] == 4
    assert "Elderly" in (parsed["medical_concerns"] or "")
    assert parsed["location_name"] == "Vizag"
    assert parsed["latitude"] is not None
    assert parsed["location_type"] == "LANDMARK_APPROX"
    assert parsed["is_location_missing"] is False

def test_structured_sms_fire_trapped():
    sms = "HELP|FIRE|NEAR BUS STAND|TRAPPED"
    parsed = EmergencyParserService.parse_sms(sms, "+919848033443")
    
    assert parsed["category"] == "FIRE"
    assert parsed["priority"] == "CRITICAL"
    assert "Bus Stand" in (parsed["location_name"] or "")
    assert parsed["is_location_missing"] is False

def test_missing_location_detection():
    sms = "HELP|MED|NO LOCATION GIVEN|BLEEDING SEVERELY"
    parsed = EmergencyParserService.parse_sms(sms, "+919848099887")
    
    assert parsed["is_location_missing"] is True
    assert parsed["latitude"] is None
    assert parsed["longitude"] is None

def test_coordinate_validation():
    # Valid coordinates
    assert EmergencyParserService._extract_coordinates("At 17.7234, 83.3012 please help") == (17.7234, 83.3012)
    # Out of range coordinates should be rejected
    assert EmergencyParserService._extract_coordinates("At 999.7234, 888.3012 please help") is None

def test_natural_language_parsing():
    sms = "Water rising fast in my house near RK Beach 5 family members stuck on roof"
    parsed = EmergencyParserService.parse_sms(sms, "+919848044556")
    
    assert parsed["message_format"] == "NATURAL_LANGUAGE"
    assert parsed["category"] in ["FLOOD", "RESCUE"]
    assert parsed["affected_count"] == 5
    assert parsed["location_name"] == "Rk Beach"
