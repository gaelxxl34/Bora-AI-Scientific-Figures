# schemas/figure.py — Pydantic request/response schemas for figures

from typing import List, Optional

from pydantic import BaseModel
from datetime import datetime


class FigureCreate(BaseModel):
    title: str = "Untitled Figure"
    project_id: str


class FigureUpdate(BaseModel):
    title: Optional[str] = None
    svg_content: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class FigureResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    title: str
    svg_content: Optional[str]
    thumbnail_url: Optional[str]
    is_public: bool
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
