from fastapi import APIRouter, Depends, HTTPException
from .db import jobs_col, users_col
from .auth import get_current_user
from bson import ObjectId
import random
from typing import List, Dict, Any

# Remove any prefix since jobs.py already uses /jobs prefix
router = APIRouter()

def serialize_job(job: Dict[str, Any]) -> Dict[str, Any]:
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

# Change the route to avoid conflict with jobs.py
@router.get("/recommended-jobs")
async def get_recommended_jobs(current_user: dict = Depends(get_current_user)):
    try:
        print(f"Getting recommended jobs for user: {current_user['email']}")
        user_id = current_user["id"]
        
        user = await users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_skills = user.get("skills", [])
        print(f"User skills: {user_skills}")
        
        all_jobs = await jobs_col.find({}).to_list(length=100)
        print(f"Found {len(all_jobs)} total jobs in database")
        
        if not all_jobs:
            print("No jobs found in database")
            return []
        
        serialized_jobs = [serialize_job(job) for job in all_jobs]
        
        if user_skills:
            recommended_jobs = []
            other_jobs = []
            
            for job in serialized_jobs:
                job_text = f"{job.get('title', '')} {job.get('description', '')}".lower()
                user_skills_normalized = [skill.lower().strip() for skill in user_skills]
                
                matched_skills = []
                for skill in user_skills_normalized:
                    if skill in job_text:
                        matched_skills.append(skill)
                
                if matched_skills:
                    job["matched_skills"] = matched_skills
                    job["match_score"] = min(100, len(matched_skills) * 20 + 60)
                    job["match_reason"] = f"Matches {len(matched_skills)} of your skills"
                    recommended_jobs.append(job)
                else:
                    job["matched_skills"] = []
                    job["match_score"] = random.randint(50, 75)
                    job["match_reason"] = "Based on your profile"
                    other_jobs.append(job)
            
            print(f"Found {len(recommended_jobs)} skill-matched jobs")
            print(f"Found {len(other_jobs)} other jobs")
            
            recommended_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
            other_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
            
            result = recommended_jobs + other_jobs
            final_result = result[:6]
            print(f"Returning {len(final_result)} recommended jobs")
            return final_result
        
        else:
            print("User has no skills, returning random jobs")
            random_jobs = random.sample(serialized_jobs, min(6, len(serialized_jobs)))
            for job in random_jobs:
                job["matched_skills"] = []
                job["match_score"] = random.randint(70, 90)
                job["match_reason"] = "Popular jobs for you"
            
            return random_jobs
        
    except Exception as e:
        print(f"Error getting recommended jobs: {str(e)}")
        import traceback
        traceback.print_exc()
        
        try:
            all_jobs = await jobs_col.find({}).to_list(length=50)
            serialized_jobs = [serialize_job(job) for job in all_jobs]
            random_jobs = random.sample(serialized_jobs, min(6, len(serialized_jobs)))
            for job in random_jobs:
                job["matched_skills"] = []
                job["match_score"] = random.randint(70, 90)
                job["match_reason"] = "Featured job"
            return random_jobs
        except Exception as fallback_error:
            print(f"Fallback also failed: {fallback_error}")
            return []

# Remove the conflicting /jobs/ endpoint since jobs.py already has it
# @router.get("/jobs/")
# async def get_all_jobs(current_user: dict = Depends(get_current_user)):
#     # This conflicts with jobs.py router - remove it
#     pass

@router.get("/debug-jobs")
async def debug_jobs():
    try:
        job_count = await jobs_col.count_documents({})
        jobs = await jobs_col.find({}).to_list(length=5)
        
        result = {
            "total_jobs": job_count,
            "sample_jobs": []
        }
        
        for job in jobs:
            result["sample_jobs"].append({
                "id": str(job.get("_id")),
                "title": job.get("title"),
                "company_name": job.get("company_name"),
                "location": job.get("location"),
                "remote": job.get("remote"),
                "keys": list(job.keys())
            })
        
        return result
    except Exception as e:
        return {"error": str(e)}

# Test endpoint
@router.get("/test-recommend")
async def test_recommend():
    return {"message": "Recommend router is working!"}