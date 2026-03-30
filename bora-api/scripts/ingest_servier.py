# scripts/ingest_servier.py — Download + embed Servier Medical Art SVGs
# Source: smart.servier.com (CC BY 3.0)
# ~3,500 icons — medical and biology illustrations

"""
Ingestion pipeline for Servier Medical Art:
1. Download SVG archive from Servier website / GitHub mirror
2. Extract and walk all SVGs
3. Normalise SVG (viewBox, clean styles)
4. Generate text description per icon
5. Embed description with sentence-transformers
6. Insert into icons table
"""

import asyncio
import io
import logging
import os
import sys
import zipfile
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.database import SessionLocal, init_db
from services.icons.ingestor import normalise_svg, ingest_icons

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Servier Medical Art provides a downloadable ZIP of all SVGs
# Using the GitHub mirror which is more reliable for automation
DOWNLOAD_URL = "https://github.com/servier-art/servier-medical-art/archive/refs/heads/main.zip"
DATA_DIR = Path(__file__).parent / "_data" / "servier"

CATEGORY_MAP = {
    "anatomy": "Anatomy",
    "cardiovascular": "Cardiovascular",
    "cellular_biology": "Cell Biology",
    "cell_biology": "Cell Biology",
    "digestive_system": "Digestive System",
    "endocrinology": "Endocrinology",
    "haematology": "Haematology",
    "immunology": "Immunology",
    "microbiology": "Microbiology",
    "molecular_biology": "Molecular Biology",
    "musculoskeletal": "Musculoskeletal",
    "nervous_system": "Neuroscience",
    "neuroscience": "Neuroscience",
    "oncology": "Oncology",
    "ophthalmology": "Ophthalmology",
    "pulmonology": "Pulmonology",
    "reproductive_system": "Reproductive System",
    "respiratory": "Respiratory",
    "virology": "Virology",
}


def download_and_extract():
    """Download and extract the Servier SVG archive."""
    if DATA_DIR.exists() and any(DATA_DIR.rglob("*.svg")):
        logger.info("Servier data already downloaded.")
        return

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Downloading Servier Medical Art archive …")

    try:
        resp = requests.get(DOWNLOAD_URL, timeout=120, stream=True)
        resp.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
            zf.extractall(DATA_DIR)
        logger.info("Extracted to %s", DATA_DIR)
    except Exception as e:
        logger.error("Failed to download Servier archive: %s", e)
        logger.info("You can manually place SVG files in %s", DATA_DIR)
        return


def collect_svgs() -> list[dict]:
    """Walk the extracted archive and collect all SVG files."""
    icons = []
    for svg_path in DATA_DIR.rglob("*.svg"):
        rel = svg_path.relative_to(DATA_DIR)
        parts = [p.lower().replace("-", "_").replace(" ", "_") for p in rel.parts]

        category = None
        for part in parts:
            if part in CATEGORY_MAP:
                category = CATEGORY_MAP[part]
                break
        if not category and len(parts) > 1:
            category = parts[0].replace("_", " ").title()

        name = svg_path.stem.replace("-", " ").replace("_", " ")
        tags = [t for t in name.split() if len(t) > 1]
        if category:
            tags.append(category.lower())
        tags.append("medical")

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
            "license": "CC BY 3.0",
            "r2_key": f"servier/{'/'.join(str(rel).split(os.sep))}",
            "svg_content": svg_content,
        })

    return icons


async def main():
    download_and_extract()
    icons_data = collect_svgs()
    logger.info("Found %d Servier SVGs.", len(icons_data))

    await init_db()
    async with SessionLocal() as session:
        count = await ingest_icons(session, icons_data, source="servier")
        logger.info("Done. Ingested %d new Servier icons.", count)


if __name__ == "__main__":
    asyncio.run(main())
