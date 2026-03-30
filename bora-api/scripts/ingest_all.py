# scripts/ingest_all.py — Run all icon ingestion pipelines
# Downloads, normalises, embeds, and stores icons from all 4 sources:
#   Bioicons (~2,700) + Servier (~3,500) + SciDraw (~500) + Reactome (~1,600)
#   Total: ~8,300+ icons

import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


async def main():
    from models.database import init_db
    from services.icons.search import count_icons
    from models.database import SessionLocal

    logger.info("=" * 60)
    logger.info("BORA ICON INGESTION — All Sources")
    logger.info("=" * 60)

    # Initialise DB + pgvector
    await init_db()

    # Run each ingestion pipeline
    from scripts.ingest_bioicons import main as ingest_bioicons
    from scripts.ingest_servier import main as ingest_servier
    from scripts.ingest_scidraw import main as ingest_scidraw
    from scripts.ingest_reactome import main as ingest_reactome

    logger.info("\n[1/4] Bioicons …")
    await ingest_bioicons()

    logger.info("\n[2/4] Servier Medical Art …")
    await ingest_servier()

    logger.info("\n[3/4] SciDraw …")
    await ingest_scidraw()

    logger.info("\n[4/4] Reactome …")
    await ingest_reactome()

    # Summary
    async with SessionLocal() as session:
        total = await count_icons(session)

    logger.info("=" * 60)
    logger.info("DONE — Total icons in library: %d", total)
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
