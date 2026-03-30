# services/icons/search.py — pgvector semantic search for icons

import logging
from typing import List, Optional
from sqlalchemy import select, text, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.icon import Icon
from services.icons.embedder import embed_text

logger = logging.getLogger(__name__)


async def search_icons(
    session: AsyncSession,
    query: str,
    limit: int = 20,
    category: Optional[str] = None,
) -> List[Icon]:
    """
    Semantic search for icons matching the query.
    1. Embed query text with sentence-transformers
    2. Run pgvector cosine distance search
    3. Optionally filter by category
    4. Return top N matching icons
    """
    query_embedding = embed_text(query)

    # Build the query — pgvector cosine distance operator: <=>
    stmt = (
        select(Icon)
        .order_by(Icon.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )

    if category:
        stmt = stmt.where(Icon.category == category)

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_icon_by_id(session: AsyncSession, icon_id: str) -> Optional[Icon]:
    """Get a single icon by ID."""
    result = await session.execute(select(Icon).where(Icon.id == icon_id))
    return result.scalar_one_or_none()


async def list_categories(session: AsyncSession) -> List[str]:
    """Return all distinct icon categories."""
    result = await session.execute(
        select(Icon.category).where(Icon.category.isnot(None)).distinct().order_by(Icon.category)
    )
    return [r[0] for r in result.all()]


async def count_icons(session: AsyncSession) -> int:
    """Total number of icons in the library."""
    result = await session.execute(select(func.count(Icon.id)))
    return result.scalar_one()
