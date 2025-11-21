from fastapi import APIRouter, HTTPException, Depends
from .config import settings
from .db import jobs_col
import httpx
from typing import List, Optional
from datetime import datetime
from .auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/jobs", tags=["jobs"])

# -------------------------------------------------------------------
# Utility function to serialize MongoDB job document
# -------------------------------------------------------------------
def serialize_job(job: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    job_copy = dict(job)
    job_copy["id"] = str(job_copy["_id"])
    job_copy["_id"] = str(job_copy["_id"])
    # Convert any nested ObjectIds in 'raw' if present
    if "raw" in job_copy and isinstance(job_copy["raw"], dict):
        job_copy["raw"] = {k: str(v) if isinstance(v, ObjectId) else v for k, v in job_copy["raw"].items()}
    return job_copy


# -------------------------------------------------------------------
# FETCH JOBS FROM FINDWORK + STORE IN MONGODB
# -------------------------------------------------------------------
async def fetch_from_findwork(
    search: Optional[str] = None, 
    location: Optional[str] = None, 
    page: int = 1
):
    headers = {"Authorization": f"Token {settings.FINDWORK_API_KEY}"}
    params = {"page": page}
    if search:
        params["search"] = search
    if location:
        params["location"] = location

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(settings.FINDWORK_API_URL, headers=headers, params=params)

        # Debug logging
        print("\n----------------------------")
        print("🔍 FindWork Fetch Debug")
        print("URL:", client.build_request("GET", settings.FINDWORK_API_URL, params=params).url)
        print("Status:", resp.status_code)
        print("Response (first 500 chars):", resp.text[:500], "...")
        print("----------------------------\n")

        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])
    for job in results:
        job_id = str(job.get("id"))

        job_doc = {
            "job_id": job_id,
            "title": job.get("role") or job.get("title"),
            "company_name": job.get("company_name"),
            "location": job.get("location"),
            "remote": job.get("remote"),
            "description": job.get("description"),
            "url": job.get("url"),
            "date_posted": job.get("created_at"),
            "raw": job,
        }

        # Upsert into MongoDB
        await jobs_col.update_one(
            {"job_id": job_id},
            {"$set": job_doc},
            upsert=True
        )

    return True


# -------------------------------------------------------------------
# LIST JOBS FROM MONGODB
# -------------------------------------------------------------------
@router.get("/", response_model=List[dict])
async def list_jobs(
    q: Optional[str] = None, 
    location: Optional[str] = None, 
    limit: int = 20, 
    offset: int = 0
):
    query = {}
    # Title/keyword search
    if q:
        query["title"] = {"$regex": q, "$options": "i"}

    # Location search including remote
    if location:
        if location.lower() == "remote":
            query["remote"] = True
        else:
            query["location"] = {"$regex": location, "$options": "i"}

    cursor = jobs_col.find(query).skip(offset).limit(limit)
    jobs = await cursor.to_list(length=limit)
    return [serialize_job(job) for job in jobs]


# -------------------------------------------------------------------
# GET SINGLE JOB BY job_id
# -------------------------------------------------------------------
@router.get("/{job_id}", response_model=dict)
async def get_job(job_id: str):
    job = await jobs_col.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return serialize_job(job)


# -------------------------------------------------------------------
# MANUAL FETCH ENDPOINT (FOR TESTING)
# -------------------------------------------------------------------
@router.post("/fetch")
async def trigger_fetch(current_user=Depends(get_current_user)):
    await fetch_from_findwork()
    return {"status": "ok", "message": "Jobs fetched successfully"}
