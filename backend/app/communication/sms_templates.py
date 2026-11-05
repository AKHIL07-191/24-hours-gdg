class SMSTemplates:
    @staticmethod
    def acknowledgement(request_id: str) -> str:
        return f"DISASTER AUTHORITY ACKNOWLEDGEMENT: Emergency request [{request_id}] has been RECEIVED by Disaster Response Authorities. Teams are being coordinated. Keep your phone line open."

    @staticmethod
    def under_review(request_id: str) -> str:
        return f"DISASTER AUTHORITY: Emergency request [{request_id}] is under active review by Command Operations."

    @staticmethod
    def missing_location(request_id: str) -> str:
        return f"DISASTER AUTHORITY: Emergency request [{request_id}] was RECEIVED, but location is missing. Reply with landmark or GPS (e.g. NEAR BUS STAND or 17.72,83.30)."

    @staticmethod
    def responder_dispatched(request_id: str, team_name: str, team_phone: str) -> str:
        return f"DISASTER AUTHORITY: Rescue team '{team_name}' ({team_phone}) has been DISPATCHED for request [{request_id}]. Stay calm and safe."

    @staticmethod
    def resolved(request_id: str) -> str:
        return f"DISASTER AUTHORITY: Emergency operation [{request_id}] marked as RESOLVED by the response team. Contact us if you need further help."

    @staticmethod
    def custom_update(request_id: str, message: str) -> str:
        # Keep SMS <= 160 characters
        trimmed = message[:110]
        return f"DISASTER AUTHORITY [{request_id}]: {trimmed}"
