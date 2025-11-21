from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import router as auth_router
from .jobs import router as jobs_router
from .applications import router as applications_router
from .apply_later import router as apply_router
from .recommend import router as recommend_router  # Make sure this import works
from .scheduler import start_scheduler
from .config import settings
import os
from .db import client

app = FastAPI(title="WorkScope Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - make sure recommend_router is included
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(apply_router)
app.include_router(applications_router)
app.include_router(recommend_router)  # This must be present

# Debug: Print all routes
@app.on_event("startup")
async def startup_event():
    # Print all registered routes for debugging
    print("=== REGISTERED ROUTES ===")
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            print(f"{list(route.methods)} {route.path}")
    print("=========================")
    
    try:
        await client.admin.command('ping')
        print("MongoDB connected successfully!")
        user_count = await client.workscope.users.count_documents({})
        print(f"Users in database: {user_count}")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
    
    start_scheduler(app)
    print("Scheduler started; fetching jobs periodically.")

@app.get("/")
async def root():
    return {"status": "ok", "message": "WorkScope backend running"}