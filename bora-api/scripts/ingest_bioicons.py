# scripts/ingest_bioicons.py — Download + embed all Bioicons SVGs
# Source: github.com/duerrsimon/bioicons (CC0 / MIT)
# ~2,700 icons across categories like cell biology, chemistry, etc.

"""
Ingestion pipeline for Bioicons:
1. Clone/download Bioicons GitHub repo
2. Walk all SVG files
3. Normalise SVG (viewBox, clean styles)
4. Generate text description per icon
5. Embed description with sentence-transformers
6. Insert into icons table
"""

import asyncio
import json
import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.database import SessionLocal, init_db
from services.icons.ingestor import normalise_svg, ingest_icons

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

REPO_URL = "https://github.com/duerrsimon/bioicons.git"
CLONE_DIR = Path(__file__).parent / "_data" / "bioicons"

# Category mapping from folder names
CATEGORY_MAP = {
    "cell_biology": "Cell Biology",
    "cell biology": "Cell Biology",
    "molecular_biology": "Molecular Biology",
    "molecular biology": "Molecular Biology",
    "chemistry": "Chemistry",
    "genetics": "Genetics",
    "immunology": "Immunology",
    "microbiology": "Microbiology",
    "neuroscience": "Neuroscience",
    "pharmacology": "Pharmacology",
    "anatomy": "Anatomy",
    "organisms": "Organisms",
    "equipment": "Lab Equipment",
    "general": "General",
    "safety": "Safety",
}


def clone_repo():
    """Clone or update the Bioicons repo."""
    if CLONE_DIR.exists():
        logger.info("Bioicons repo already cloned, pulling latest …")
        subprocess.run(["git", "-C", str(CLONE_DIR), "pull", "--ff-only"], check=False)
    else:
        logger.info("Cloning Bioicons repo …")
        CLONE_DIR.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "--depth", "1", REPO_URL, str(CLONE_DIR)], check=True)


def collect_svgs() -> list[dict]:
    """Walk the repo and collect all SVG files with metadata."""
    icons = []
    svg_dirs = [CLONE_DIR / "static" / "icons", CLONE_DIR / "icons"]

    for svg_dir in svg_dirs:
        if not svg_dir.exists():
            continue
        for svg_path in svg_dir.rglob("*.svg"):
            rel = svg_path.relative_to(svg_dir)
            parts = rel.parts

            # Derive category from folder structure
            category = None
            if len(parts) > 1:
                folder = parts[0].lower().replace("-", "_")
                category = CATEGORY_MAP.get(folder, parts[0].replace("-", " ").replace("_", " ").title())

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
                "license": "CC0",
                "r2_key": f"bioicons/{'/'.join(parts)}",
                "svg_content": svg_content,
            })

    return icons


async def main():
    clone_repo()
    icons_data = collect_svgs()
    logger.info("Found %d Bioicons SVGs.", len(icons_data))

    await init_db()
    async with SessionLocal() as session:
        count = await ingest_icons(session, icons_data, source="bioicons")
        logger.info("Done. Ingested %d new Bioicons.", count)


if __name__ == "__main__":
    asyncio.run(main())
