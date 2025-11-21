import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the project root (backend/.env)
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI")
    JWT_SECRET: str = os.getenv("JWT_SECRET")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    FINDWORK_API_KEY: str = os.getenv("FINDWORK_API_KEY")
    FINDWORK_API_URL: str = os.getenv("FINDWORK_API_URL", "https://findwork.dev/api/jobs/")
    FCM_SERVER_KEY: str = os.getenv("FCM_SERVER_KEY")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./app/static/uploads")
    CRON_FETCH_INTERVAL_MINUTES: int = int(os.getenv("CRON_FETCH_INTERVAL_MINUTES", "60"))

settings = Settings()
