# scripts/ingest_scidraw.py — Download + embed SciDraw assets
# Source: scidraw.io (CC BY 4.0)
# ~500 icons — high-quality neuroscience and general biology drawings

"""
Ingestion pipeline for SciDraw:
1. Clone SciDraw GitHub repo (SVG assets)
2. Walk all SVG files
3. Normalise SVG
4. Generate text descriptions
5. Embed descriptions
6. Insert into icons table
"""

import asyncio
import logging
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.database import SessionLocal, init_db
from services.icons.ingestor import normalise_svg, ingest_icons

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

REPO_URL = "https://github.com/scidraw/scidraw.git"
CLONE_DIR = Path(__file__).parent / "_data" / "scidraw"

CATEGORY_MAP = {
    "neuroscience": "Neuroscience",
    "neuro": "Neuroscience",
    "brain": "Neuroscience",
    "cell": "Cell Biology",
    "molecular": "Molecular Biology",
    "animal": "Organisms",
    "equipment": "Lab Equipment",
    "general": "General",
    "behavior": "Behavioral Science",
}


def clone_repo():
    """Clone or update the SciDraw repo."""
    if CLONE_DIR.exists():
        logger.info("SciDraw repo already cloned, pulling …")
        subprocess.run(["git", "-C", str(CLONE_DIR), "pull", "--ff-only"], check=False)
    else:
        logger.info("Cloning SciDraw repo …")
        CLONE_DIR.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "--depth", "1", REPO_URL, str(CLONE_DIR)], check=True)


def collect_svgs() -> list[dict]:
    """Walk the repo and collect all SVG files."""
    icons = []
    for svg_path in CLONE_DIR.rglob("*.svg"):
        rel = svg_path.relative_to(CLONE_DIR)
        parts = rel.parts

        category = None
        for part in parts:
            key = part.lower().replace("-", "_").replace(" ", "_")
            if key in CATEGORY_MAP:
                category = CATEGORY_MAP[key]
                break
        if not category and len(parts) > 1:
            category = parts[0].replace("-", " ").replace("_", " ").title()

        name = svg_path.stem.replace("-", " ").replace("_", " ")
        tags = [t for t in name.split() if len(t) > 1]
        if category:
            tags.append(category.lower())

        try:
            raw_svg = svg_path.read_text(encoding="utf-8")
            svg_content = normalise_svg(raw_svg)
        except Exception as e:
            logger.warning("Skipping %s: %s", svg_path, e)
            continue

        icons.append({
            "name": name,
            "tags": tags,
            "category": category,
            "license": "CC BY 4.0",
            "r2_key": f"scidraw/{'/'.join(parts)}",
            "svg_content": svg_content,
        })

    return icons


async def main():
    clone_repo()
    icons_data = collect_svgs()
    logger.info("Found %d SciDraw SVGs.", len(icons_data))

    await init_db()
    async with SessionLocal() as session:
        count = await ingest_icons(session, icons_data, source="scidraw")
        logger.info("Done. Ingested %d new SciDraw icons.", count)


if __name__ == "__main__":
    asyncio.run(main())
