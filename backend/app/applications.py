from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from .auth import get_current_user
from .db import applications_col, jobs_col

router = APIRouter(prefix="/applications", tags=["applications"])

@router.post("/")
async def create_application(jobId: str, current_user: dict = Depends(get_current_user)):
    # Check if job exists
    job = await jobs_col.find_one({"job_id": jobId})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Create application
    application = {
        "user_id": current_user["id"],
        "job_id": jobId,
        "status": "pending",
        "applied_date": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    result = await applications_col.insert_one(application)
    application["_id"] = result.inserted_id
    
    return {
        "id": str(application["_id"]),
        "jobId": jobId,
        "userId": current_user["id"],
        "status": "pending",
        "appliedDate": application["applied_date"],
        "job": {
            "id": jobId,
            "title": job.get("title") or job.get("role"),
            "company": job.get("company_name"),
            "location": job.get("location")
        }
    }

@router.get("/")
async def get_user_applications(current_user: dict = Depends(get_current_user)):
    applications = await applications_col.find({
        "user_id": current_user["id"]
    }).to_list(length=100)
    
    result = []
    for app in applications:
        job = await jobs_col.find_one({"job_id": app["job_id"]})
        result.append({
            "id": str(app["_id"]),
            "jobId": app["job_id"],
            "userId": app["user_id"],
            "status": app["status"],
            "appliedDate": app["applied_date"],
            "job": {
                "id": app["job_id"],
                "title": job.get("title") or job.get("role") if job else "Unknown",
                "company": job.get("company_name") if job else "Unknown",
                "location": job.get("location") if job else "Unknown"
            }
        })
    
    return result