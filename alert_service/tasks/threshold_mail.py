from celery_app.celery_app import app
from redis_client import alert_already_sent, mark_alert_sent
from resend_client import send_threshold_alert
from config import settings
from supabase import create_client

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


@app.task(name="tasks.threshold_mail.send_threshold_alert_task", bind=True, max_retries=3)
def send_threshold_alert_task(self, farm_id: str, device: str, anomalies: dict):
    """
    Celery task — sends anomaly alert email to the farm owner.
    Skips if the same alert was already sent within the last hour (Redis dedup).
    Retries up to 3 times on failure.
    """
    try:
        # Check which sensors are actually anomalous
        flagged = [sensor for sensor, is_anomaly in anomalies.items() if is_anomaly]

        if not flagged:
            return {"status": "skipped", "reason": "no anomalies"}

        # Deduplicate — skip sensors already alerted in the TTL window
        new_alerts = [s for s in flagged if not alert_already_sent(farm_id, s)]

        if not new_alerts:
            return {"status": "skipped", "reason": "all alerts already sent recently"}

        # Fetch farm + owner details from Supabase
        farm_result = supabase.table("farms").select(
            "farm_name, owners(first_name, last_name, email)"
        ).eq("id", farm_id).execute()

        if not farm_result.data:
            return {"status": "error", "reason": f"farm {farm_id} not found"}

        farm = farm_result.data[0]
        owner = farm.get("owners")

        if not owner or not owner.get("email"):
            return {"status": "error", "reason": "owner email not found"}

        owner_name = f"{owner['first_name']} {owner['last_name']}"

        # Send the email
        send_threshold_alert(
            to_email=owner["email"],
            owner_name=owner_name,
            farm_name=farm["farm_name"],
            device=device,
            anomalies={s: True for s in new_alerts},
            analytics_url=settings.ANALYTICS_URL,
        )

        # Mark each alerted sensor in Redis
        for sensor in new_alerts:
            mark_alert_sent(farm_id, sensor)

        return {
            "status": "sent",
            "to": owner["email"],
            "sensors": new_alerts,
        }

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)  # retry after 60 seconds