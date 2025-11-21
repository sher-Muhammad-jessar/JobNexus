# app/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# Add SSL configuration to fix connection issues
client = AsyncIOMotorClient(
    settings.MONGODB_URI,
    tls=True,
    tlsAllowInvalidCertificates=True,  # Bypass SSL certificate validation
    connectTimeoutMS=30000,
    socketTimeoutMS=30000,
    serverSelectionTimeoutMS=30000
)

db = client["workscope"]
# collections:
users_col = db["users"]
jobs_col = db["jobs"]
apply_later_col = db["apply_later"]
applications_col = db["applications"]