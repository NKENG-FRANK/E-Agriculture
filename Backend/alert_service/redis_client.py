import redis
from config import settings

# Single Redis connection pool shared across the app
client = redis.from_url(settings.REDIS_URL, decode_responses=True)

ALERT_TTL = 3600  # 1 hour — won't resend same alert within this window


def alert_already_sent(farm_id: str, sensor: str) -> bool:
    """Return True if this sensor alert was already sent within the TTL window."""
    key = f"alert:{farm_id}:{sensor}"
    return client.exists(key) == 1


def mark_alert_sent(farm_id: str, sensor: str):
    """Mark this sensor alert as sent — expires after ALERT_TTL seconds."""
    key = f"alert:{farm_id}:{sensor}"
    client.setex(key, ALERT_TTL, "sent")


def clear_alert(farm_id: str, sensor: str):
    """Manually clear an alert (e.g. when sensor returns to normal)."""
    key = f"alert:{farm_id}:{sensor}"
    client.delete(key)