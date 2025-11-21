from apscheduler.schedulers.asyncio import AsyncIOScheduler
from .jobs import fetch_from_findwork
from .db import apply_later_col, users_col, jobs_col
from datetime import datetime, timedelta
from .config import settings
from bson import ObjectId
import asyncio
import httpx

scheduler = AsyncIOScheduler()

async def send_push_notification(user_token: str, title: str, body: str):
    # Placeholder for real FCM push notification
    async with httpx.AsyncClient() as client:
        # Example: using FCM legacy endpoint
        # headers = {"Authorization": f"key={settings.FCM_SERVER_KEY}", "Content-Type": "application/json"}
        # payload = {"to": user_token, "notification": {"title": title, "body": body}}
        # r = await client.post("https://fcm.googleapis.com/fcm/send", headers=headers, json=payload)
        return True

async def check_deadlines_and_notify():
    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)

    items = await apply_later_col.find({}).to_list(length=1000)

    for item in items:
        job = await jobs_col.find_one({"job_id": item.get("job_id")})
        if not job:
            continue

        last_date = job.get("last_date")
        if not last_date:
            continue

        if isinstance(last_date, str):
            try:
                last_date_dt = datetime.fromisoformat(last_date)
            except Exception:
                continue
        else:
            last_date_dt = last_date

        if last_date_dt.date() in [now.date(), tomorrow.date()]:
            # safely convert user_id to ObjectId
            try:
                user_id = ObjectId(item.get("user_id"))
            except Exception:
                continue

            user = await users_col.find_one({"_id": user_id})
            if not user:
                continue

            fcm_token = user.get("fcm_token")
            if fcm_token:
                title = "Apply Reminder"
                body = f"Deadline for {job.get('role')} at {job.get('company_name')} is approaching."
                await send_push_notification(fcm_token, title, body)

def start_scheduler(app=None):
    # fetch jobs periodically
    scheduler.add_job(lambda: asyncio.create_task(fetch_from_findwork()), 'interval', minutes=settings.CRON_FETCH_INTERVAL_MINUTES)
    # check deadlines hourly
    scheduler.add_job(lambda: asyncio.create_task(check_deadlines_and_notify()), 'interval', minutes=60)
    scheduler.start()
    print("Scheduler started; fetching jobs periodically.")
