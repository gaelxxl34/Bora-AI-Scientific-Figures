# api/routes/icons.py — Icon search and retrieval endpoints

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db
from schemas.icon import IconSearchResponse, IconResponse, IconDetailResponse
from services.icons.search import (
    search_icons as _search,
    get_icon_by_id,
    list_categories,
    count_icons,
)

router = APIRouter()


@router.get("/search", response_model=IconSearchResponse)
async def search_icons(
    q: str = Query(..., min_length=1),
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Semantic search for scientific icons using pgvector."""
    icons = await _search(db, query=q, limit=limit, category=category)
    return IconSearchResponse(
        query=q,
        icons=[IconResponse.model_validate(ic) for ic in icons],
        total=len(icons),
    )


@router.get("/categories", response_model=List[str])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """List all distinct icon categories."""
    return await list_categories(db)


@router.get("/count")
async def get_count(db: AsyncSession = Depends(get_db)):
    """Total number of icons in the library."""
    total = await count_icons(db)
    return {"total": total}


@router.get("/{icon_id}", response_model=IconDetailResponse)
async def get_icon(icon_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single icon by ID with full metadata and SVG content."""
    icon = await get_icon_by_id(db, icon_id)
    if not icon:
        raise HTTPException(status_code=404, detail="Icon not found")
    return IconDetailResponse.model_validate(icon)
