from pydantic import BaseModel, EmailStr, constr, Field
from typing import List, Optional
from datetime import datetime

# ----------------------
# User models
# ----------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: constr(min_length=6, max_length=72)
    name: Optional[str] = None
    skills: List[constr(strip_whitespace=True, min_length=1)]  # <-- REQUIRED

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    skills: List[str]

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ----------------------
# Job model (partial)
# ----------------------
class JobInDB(BaseModel):
    id: int
    role: str
    company_name: str
    location: Optional[str]
    remote: Optional[bool] = False
    description: Optional[str] = None
    date_posted: Optional[datetime]
    last_date: Optional[datetime]
    raw: dict = {}

# ----------------------
# Apply-later model
# ----------------------
class ApplyLaterItem(BaseModel):
    user_id: str
    job_id: int
    saved_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"
