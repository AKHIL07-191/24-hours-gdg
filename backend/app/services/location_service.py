import math
from typing import Tuple, Optional, List, Dict, Any

class LocationService:
    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates great-circle distance between two GPS points in kilometers"""
        R = 6371.0 # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)

    @staticmethod
    def is_valid_gps(lat: Optional[float], lon: Optional[float]) -> bool:
        if lat is None or lon is None:
            return False
        return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0
