from celery import Celery

# Connect to the Redis container running on port 6379
celery_app = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["app.worker"]
)


celery_app.conf.timezone = 'UTC'