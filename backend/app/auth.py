from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import constr
from typing import List
from datetime import timedelta
from bson import ObjectId

from .models import UserCreate, UserOut, Token
from .db import users_col
from .utils import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# ----------------------
# Register User
# ----------------------
@router.post("/register", response_model=UserOut)
async def register(user: UserCreate):
    # ---- PRINT RAW INPUT ----
    print("Raw input from client:", user.dict())

    email_normalized = user.email.lower()
    existing = await users_col.find_one({"email": email_normalized})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)

    # ---- PRINT SKILLS BEFORE CLEANING ----
    print("Skills before cleaning:", user.skills)

    # Clean and validate skills
    skills = [skill.strip() for skill in user.skills if skill.strip()]

    # ---- PRINT SKILLS AFTER CLEANING ----
    print("Skills after cleaning:", skills)

    if not skills:
        raise HTTPException(status_code=400, detail="Skills cannot be empty")

    # Insert into DB
    res = await users_col.insert_one({
        "email": email_normalized,
        "password": hashed_password,
        "name": user.name,
        "skills": skills
    })

    user_doc = await users_col.find_one({"_id": res.inserted_id})

    # ---- PRINT FINAL DB DOCUMENT ----
    print("Inserted document:", user_doc)

    return {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "name": user_doc.get("name"),
        "skills": user_doc.get("skills")
    }

# ----------------------
# Login User & Get Token
# ----------------------
@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # 🔧 ADDED DEBUG LINES - This will show what the backend receives
    print(f"🔧 DEBUG: Received login request")
    print(f"🔧 DEBUG - Username received: {form_data.username}")
    print(f"🔧 DEBUG - Password received: {form_data.password}")
    
    email_normalized = form_data.username.lower()
    user = await users_col.find_one({"email": email_normalized})

    print(f"🔧 DEBUG - User found in database: {user is not None}")

    if not user or not verify_password(form_data.password, user["password"]):
        print(f"🔧 DEBUG - Login failed: User not found or password incorrect")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_access_token(str(user["_id"]), expires_delta=timedelta(hours=1))
    print(f"🔧 DEBUG - Login successful, token generated for user: {user['email']}")
    return {"access_token": token, "token_type": "bearer"}


# ----------------------
# Get Current User
# ----------------------
async def get_current_user(token: str = Depends(oauth2_scheme)):
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "skills": user.get("skills")
    }


# ----------------------
# Fetch Current User
# ----------------------
@router.get("/me", response_model=UserOut)
async def read_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ----------------------
# Update User Skills
# ----------------------
@router.put("/skills", response_model=UserOut)
async def update_skills(
    skills: List[constr(strip_whitespace=True, min_length=1)] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    # Remove duplicates and empty strings
    clean_skills = list({skill.strip() for skill in skills if skill.strip()})
    if not clean_skills:
        raise HTTPException(status_code=400, detail="Skills cannot be empty")

    # Update the skills in the database
    update_result = await users_col.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"skills": clean_skills}}
    )

    if update_result.modified_count == 0:
        # Optional: return an info if nothing was updated
        print("No changes made to skills (skills may be the same as before).")

    # Fetch updated user document
    user = await users_col.find_one({"_id": ObjectId(current_user["id"])})

    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "skills": user.get("skills")
    }