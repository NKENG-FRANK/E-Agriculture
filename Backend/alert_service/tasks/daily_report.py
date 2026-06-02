import httpx
from celery_app.celery_app import app
from resend_client import send_daily_report
from config import settings
from supabase import create_client

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


@app.task(name="tasks.daily_report.send_all_daily_reports")
def send_all_daily_reports():
    """
    Celery Beat task — runs every day at 7AM UTC.
    Fetches all owners, their farms, and latest analytics,
    then sends each owner a daily summary email.
    """
    # Fetch all owners with their farms
    owners_result = supabase.table("owners").select(
        "id, first_name, last_name, email, farms(id, farm_name, location, farm_type, account_status)"
    ).execute()

    if not owners_result.data:
        return {"status": "skipped", "reason": "no owners found"}

    sent = []
    errors = []

    for owner in owners_result.data:
        email = owner.get("email")
        farms = owner.get("farms", [])

        if not email or not farms:
            continue

        owner_name = f"{owner['first_name']} {owner['last_name']}"
        farms_with_analytics = []

        for farm in farms:
            # Fetch latest analytics per farm device
            try:
                analytics = httpx.get(
                    f"{settings.ANALYTICS_URL}/analytics",
                    params={"device": farm["farm_name"]},
                    timeout=5,
                ).json()
            except Exception:
                analytics = None

            farms_with_analytics.append({
                "farm_name": farm["farm_name"],
                "location": farm.get("location", "—"),
                "farm_type": farm.get("farm_type", "—"),
                "status": farm.get("account_status", "—"),
                "averages": analytics.get("averages") if analytics else None,
                "anomaly_message": analytics.get("latest_anomalies", {}).get("message") if analytics else "No data",
            })

        try:
            send_daily_report(
                to_email=email,
                owner_name=owner_name,
                farms=farms_with_analytics,
            )
            sent.append(email)
        except Exception as e:
            errors.append({"email": email, "error": str(e)})

    return {"status": "done", "sent": sent, "errors": errors}