# models/user.py — User/Profile table (maps to Supabase auth.users)

from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from models.database import Base


class User(Base):
    __tablename__ = \"profiles\"

    id = Column(String, primary_key=True)  # matches auth.users.id (UUID)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default=\"user\")  # user | admin | super_admin
    plan = Column(String, default=\"free\")  # free | pro | lab
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
