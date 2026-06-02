import resend
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from config import settings

resend.api_key = settings.RESEND_API_KEY

# Jinja2 template loader — looks in alert_service/templates/
_env = Environment(
    loader=FileSystemLoader(Path(__file__).parent / "templates"),
    autoescape=True,
)


def _render(template_name: str, context: dict) -> str:
    """Render an HTML email template with the given context."""
    return _env.get_template(template_name).render(**context)


def send_threshold_alert(
    to_email: str,
    owner_name: str,
    farm_name: str,
    device: str,
    anomalies: dict,
    analytics_url: str,
):
    """Send anomaly threshold alert email to farm owner."""
    html = _render("threshold_alert.html", {
        "owner_name": owner_name,
        "farm_name": farm_name,
        "device": device,
        "anomalies": anomalies,
        "analytics_url": analytics_url,
    })

    resend.Emails.send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": f" Sensor Alert — {farm_name} ({device})",
        "html": html,
    })


def send_consultation_invite(
    to_email: str,
    fullname: str,
    farm_type: str,
    signup_url: str,
):
    """Send signup invitation email to approved consultation applicant."""
    html = _render("invite_mail.html", {
        "fullname": fullname,
        "farm_type": farm_type,
        "signup_url": signup_url,
    })

    resend.Emails.send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": "🌿 You're invited to join SFMS",
        "html": html,
    })


def send_daily_report(
    to_email: str,
    owner_name: str,
    farms: list,
):
    """Send daily farm summary report to owner."""
    html = _render("daily_report.html", {
        "owner_name": owner_name,
        "farms": farms,
    })

    resend.Emails.send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": "Your Daily Farm Report — SFMS",
        "html": html,
    })