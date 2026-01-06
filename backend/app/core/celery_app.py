import os
from celery import Celery

# Use environment variables for Redis URL (Docker uses service names, local uses localhost)
REDIS_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
REDIS_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

celery_app = Celery(
    "worker",
    broker=REDIS_BROKER_URL,
    backend=REDIS_RESULT_BACKEND,
    include=["app.worker"]
)

celery_app.conf.timezone = 'UTC'