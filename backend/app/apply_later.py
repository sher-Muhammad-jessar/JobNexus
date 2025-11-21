from fastapi import APIRouter, Depends, HTTPException
from .auth import get_current_user
from .db import apply_later_col, jobs_col, users_col
from datetime import datetime
from bson import ObjectId
from typing import List, Dict, Any

router = APIRouter(prefix="/apply", tags=["apply"])

# -------------------------------
# Helper function to serialize MongoDB documents
# -------------------------------
def serialize_doc(doc: Any) -> Any:
    """Convert ObjectId to string recursively in dict or list."""
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            elif isinstance(v, dict) or isinstance(v, list):
                new_doc[k] = serialize_doc(v)
            else:
                new_doc[k] = v
        return new_doc
    return doc

def serialize_job(job: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB job document to JSON-serializable dict."""
    try:
        job_copy = dict(job)
        
        if "_id" in job_copy:
            job_copy["id"] = str(job_copy["_id"])
            job_copy["_id"] = str(job_copy["_id"])
        
        job_copy.setdefault("title", "No Title")
        job_copy.setdefault("company_name", "Unknown Company")
        job_copy.setdefault("location", "Remote")
        job_copy.setdefault("description", "")
        job_copy.setdefault("remote", False)
        job_copy.setdefault("url", "")
        job_copy.setdefault("date_posted", "")
        job_copy.setdefault("raw", {})
        
        return job_copy
    except Exception as e:
        print(f"Error serializing job: {e}")
        return {
            "id": str(job.get("_id", "")),
            "title": "Error loading job",
            "company_name": "Unknown",
            "location": "Remote",
            "description": "Error loading job details",
            "remote": False,
            "url": "",
            "date_posted": "",
            "raw": {}
        }

# -------------------------------
# Add a job to "Apply Later"
# -------------------------------
@router.post("/add/{job_id}")
async def add_apply_later(job_id: str, user=Depends(get_current_user)):
    print(f"Adding job {job_id} to Apply Later for user {user['email']}")
    
    # Try to find job by job_id first, then by _id
    job = await jobs_col.find_one({"job_id": job_id})
    if not job:
        try:
            job = await jobs_col.find_one({"_id": ObjectId(job_id)})
        except:
            job = None
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Use the correct job_id (either from job_id field or _id)
    actual_job_id = job.get("job_id") or str(job["_id"])
    
    # Check if already saved in apply_later collection
    existing = await apply_later_col.find_one({
        "user_id": user["id"], 
        "job_id": actual_job_id
    })
    if existing:
        print(f"Job {actual_job_id} already saved for user {user['email']}")
        return {"status": "exists"}

    # Also check in user's saved_jobs array (if using that approach)
    user_doc = await users_col.find_one({"_id": ObjectId(user["id"])})
    if user_doc:
        saved_jobs = user_doc.get("saved_jobs", [])
        if actual_job_id in saved_jobs:
            print(f"Job {actual_job_id} already in user's saved_jobs")
            return {"status": "exists"}

    # Insert into apply_later collection
    doc = {
        "user_id": user["id"],
        "job_id": actual_job_id,
        "saved_at": datetime.utcnow(),
        "status": "pending",
        "user_email": user["email"]
    }
    result = await apply_later_col.insert_one(doc)
    print(f"Job {actual_job_id} saved to apply_later collection for user {user['email']}")

    # Also add to user's saved_jobs array for redundancy
    await users_col.update_one(
        {"_id": ObjectId(user["id"])},
        {"$addToSet": {"saved_jobs": actual_job_id}},
        upsert=True
    )
    
    return {"status": "saved", "message": "Job added to Apply Later"}

# -------------------------------
# List all "Apply Later" jobs for the current user
# -------------------------------
@router.get("/list")
async def list_apply_later(user=Depends(get_current_user)):
    print(f"Fetching Apply Later jobs for user {user['email']}")
    
    # Fetch saved apply_later items
    items = await apply_later_col.find({"user_id": user["id"]}).to_list(100)
    print(f"Found {len(items)} apply_later items for user {user['email']}")
    
    if not items:
        return {"jobs": [], "count": 0}
    
    job_ids = [item["job_id"] for item in items]
    print(f"Looking for jobs with IDs: {job_ids}")

    # Fetch the actual job details using both job_id and _id
    jobs = []
    for job_id in job_ids:
        # Try to find by job_id first
        job = await jobs_col.find_one({"job_id": job_id})
        if not job:
            try:
                # Try to find by _id
                job = await jobs_col.find_one({"_id": ObjectId(job_id)})
            except:
                job = None
        
        if job:
            serialized_job = serialize_job(job)
            # Mark as saved
            serialized_job["isSaved"] = True
            # Add saved_at timestamp
            saved_item = next((item for item in items if item["job_id"] == job_id), None)
            if saved_item:
                serialized_job["saved_at"] = saved_item["saved_at"].isoformat() if saved_item.get("saved_at") else None
            jobs.append(serialized_job)
        else:
            print(f"Job with ID {job_id} not found in jobs collection")

    print(f"Returning {len(jobs)} jobs for Apply Later")
    return {
        "jobs": serialize_doc(jobs),
        "count": len(jobs)
    }

# -------------------------------
# Remove a job from "Apply Later"
# -------------------------------
@router.delete("/remove/{job_id}")
async def remove_apply_later(job_id: str, user=Depends(get_current_user)):
    print(f"Removing job {job_id} from Apply Later for user {user['email']}")
    
    # Try to find the actual job to get the correct ID
    job = await jobs_col.find_one({"job_id": job_id})
    if not job:
        try:
            job = await jobs_col.find_one({"_id": ObjectId(job_id)})
        except:
            job = None
    
    # Determine the actual job ID to remove
    actual_job_id = job_id
    if job:
        actual_job_id = job.get("job_id") or str(job["_id"])

    # Remove from apply_later collection
    result = await apply_later_col.delete_one({
        "user_id": user["id"], 
        "job_id": actual_job_id
    })
    
    # Also remove from user's saved_jobs array
    await users_col.update_one(
        {"_id": ObjectId(user["id"])},
        {"$pull": {"saved_jobs": actual_job_id}}
    )

    if result.deleted_count == 0:
        print(f"Job {actual_job_id} not found in apply_later for user {user['email']}")
        return {"status": "not_found"}
    
    print(f"Job {actual_job_id} removed from Apply Later for user {user['email']}")
    return {"status": "removed", "message": "Job removed from Apply Later"}

# -------------------------------
# Get Apply Later count for stats
# -------------------------------
@router.get("/count")
async def get_apply_later_count(user=Depends(get_current_user)):
    count = await apply_later_col.count_documents({"user_id": user["id"]})
    return {"count": count}

# -------------------------------
# Check if a job is saved
# -------------------------------
@router.get("/check/{job_id}")
async def check_saved_status(job_id: str, user=Depends(get_current_user)):
    # Try to find the actual job to get the correct ID
    job = await jobs_col.find_one({"job_id": job_id})
    if not job:
        try:
            job = await jobs_col.find_one({"_id": ObjectId(job_id)})
        except:
            job = None
    
    actual_job_id = job_id
    if job:
        actual_job_id = job.get("job_id") or str(job["_id"])

    # Check in apply_later collection
    saved = await apply_later_col.find_one({
        "user_id": user["id"], 
        "job_id": actual_job_id
    })
    
    return {"is_saved": bool(saved)}