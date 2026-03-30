# services/icons/ingestor.py — Shared ingestion pipeline for all icon sources
# Normalises SVGs, embeds descriptions, and stores in DB

import hashlib
import logging
from typing import List, Optional
from lxml import etree
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.icon import Icon
from services.icons.embedder import embed_batch

logger = logging.getLogger(__name__)

# ── SVG normalisation ──────────────────────────────────────────────


def normalise_svg(raw_svg: str) -> str:
    """Clean up SVG: ensure viewBox, strip fixed width/height."""
    try:
        root = etree.fromstring(raw_svg.encode())
    except etree.XMLSyntaxError:
        return raw_svg

    if root.get("viewBox") is None:
        w = root.get("width", "100").rstrip("px")
        h = root.get("height", "100").rstrip("px")
        try:
            root.set("viewBox", f"0 0 {float(w):.0f} {float(h):.0f}")
        except ValueError:
            root.set("viewBox", "0 0 100 100")

    for attr in ("width", "height"):
        if attr in root.attrib:
            del root.attrib[attr]

    return etree.tostring(root, encoding="unicode", pretty_print=False)


def build_description(name: str, tags: List[str], category: Optional[str], source: str) -> str:
    """Build a plain-text description for embedding."""
    parts = [name.replace("-", " ").replace("_", " ")]
    if category:
        parts.append(category)
    if tags:
        parts.extend(tags[:10])
    parts.append(f"{source} scientific illustration icon")
    return " ".join(parts)


def stable_id(source: str, name: str) -> str:
    """Deterministic 12-char hex ID from source + name."""
    return hashlib.sha256(f"{source}:{name}".encode()).hexdigest()[:12]


# ── Batch insert ───────────────────────────────────────────────────


async def ingest_icons(
    session: AsyncSession,
    icons_data: List[dict],
    source: str,
    batch_size: int = 500,
) -> int:
    """
    Ingest a list of icon dicts into the DB.

    Each dict should have:
      name, tags, category, license, r2_key, svg_content
    """
    if not icons_data:
        return 0

    ids_to_check = [stable_id(source, d["name"]) for d in icons_data]
    existing: set[str] = set()
    for i in range(0, len(ids_to_check), 1000):
        chunk = ids_to_check[i : i + 1000]
        result = await session.execute(select(Icon.id).where(Icon.id.in_(chunk)))
        existing.update(r[0] for r in result.all())

    new_icons = [(d, iid) for d, iid in zip(icons_data, ids_to_check) if iid not in existing]
    if not new_icons:
        logger.info("[%s] All %d icons already ingested.", source, len(icons_data))
        return 0

    logger.info("[%s] Embedding %d new icons …", source, len(new_icons))

    descriptions = [
        build_description(d["name"], d.get("tags", []), d.get("category"), source)
        for d, _ in new_icons
    ]
    embeddings = embed_batch(descriptions, batch_size=batch_size)

    count = 0
    for (d, iid), emb in zip(new_icons, embeddings):
        icon = Icon(
            id=iid,
            name=d["name"],
            description=descriptions[count],
            tags=d.get("tags", []),
            category=d.get("category"),
            license=d.get("license"),
            source=source,
            r2_key=d.get("r2_key", f"{source}/{d['name']}.svg"),
            svg_content=d.get("svg_content"),
            thumbnail_url=d.get("thumbnail_url"),
            embedding=emb,
        )
        session.add(icon)
        count += 1

        if count % batch_size == 0:
            await session.flush()
            logger.info("[%s] Flushed %d / %d", source, count, len(new_icons))

    await session.commit()
    logger.info("[%s] Ingested %d new icons.", source, count)
    return count
