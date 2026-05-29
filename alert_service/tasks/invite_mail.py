from celery_app.celery_app import app
from resend_client import send_consultation_invite
from config import settings


@app.task(name="tasks.invite_mail.send_invite_task", bind=True, max_retries=3)
def send_invite_task(self, to_email: str, fullname: str, farm_type: str):
    """
    Celery task — sends signup invitation email to an approved consultation applicant.
    """
    try:
        send_consultation_invite(
            to_email=to_email,
            fullname=fullname,
            farm_type=farm_type,
            signup_url=settings.SIGNUP_URL,
        )
        return {"status": "sent", "to": to_email}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)