# schemas/icon.py — Pydantic schemas for icons

from typing import List, Optional

from pydantic import BaseModel


class IconResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    tags: List[str]
    category: Optional[str]
    license: Optional[str]
    source: str
    thumbnail_url: Optional[str] = None
    svg_url: Optional[str] = None

    model_config = {"from_attributes": True}


class IconSearchResponse(BaseModel):
    query: str
    icons: List[IconResponse]
    total: int


class IconDetailResponse(IconResponse):
    svg_content: Optional[str] = None
