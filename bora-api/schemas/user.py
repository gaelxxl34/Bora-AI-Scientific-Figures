# schemas/user.py — Pydantic schemas for users

from pydantic import BaseModel
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    email: str
    plan: str
    created_at: datetime

    model_config = {"from_attributes": True}
