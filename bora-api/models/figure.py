# models/figure.py — Figure table (SVG content, metadata)

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, ARRAY
from sqlalchemy.sql import func
from models.database import Base


class Figure(Base):
    __tablename__ = "figures"

    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("profiles.id"), nullable=False, index=True)
    title = Column(String, default="Untitled Figure")
    svg_content = Column(Text, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    tags = Column(ARRAY(String), default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
