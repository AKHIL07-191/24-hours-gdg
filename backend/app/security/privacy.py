import re

def mask_phone_number(phone: str) -> str:
    """
    Mask phone number for privacy preservation:
    e.g. +91 9876543210 -> +91 98765*****
    """
    if not phone:
        return "UNKNOWN"
    clean = re.sub(r"[^\d+]", "", phone)
    if len(clean) > 5:
        visible = clean[:-5]
        return f"{visible}*****"
    return "*****"

def sanitize_text(text: str) -> str:
    """Removes unsafe characters and limits length"""
    if not text:
        return ""
    # strip control characters but preserve newlines
    clean = "".join(ch for ch in text if ch.isprintable() or ch in "\n\r\t")
    return clean.strip()
