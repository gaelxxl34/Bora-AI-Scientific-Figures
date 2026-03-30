#!/usr/bin/env python3
"""
SciDraw.io Scraper
==================
Scrapes ~500 SVG scientific illustrations from https://scidraw.io

Strategy:
  1. Paginate through the main listing (35 pages, 32 drawings/page)
  2. Extract drawing ID + SVG URL + category directly from listing HTML
  3. Download SVGs, skip names we already have

License: CC-BY 4.0
"""

import os
import re
import sys
import time
import json
import requests
from pathlib import Path

# --- Configuration ---
BASE_URL = "https://scidraw.io"
DELAY = 0.5  # seconds between page requests
SVG_DELAY = 0.2  # seconds between SVG downloads
MAX_RETRIES = 3
MAX_PAGES = 50  # safety limit

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ICONS = SCRIPT_DIR.parent.parent / "public" / "icons"
DEST_DIR = PROJECT_ICONS / "scidraw"

session = requests.Session()
session.headers.update({
    "User-Agent": "Bora-AI-Scientific-Figure-Builder/1.0 (educational project)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
})


def get_existing_icon_names():
    """Collect names we already have."""
    names = set()
    manifest_path = PROJECT_ICONS / "manifest.json"
    if manifest_path.exists():
        with open(manifest_path) as f:
            for icon in json.load(f):
                names.add(icon["name"].lower().strip())
    return names


def fetch(url):
    """Fetch a URL with retries."""
    for attempt in range(MAX_RETRIES):
        try:
            resp = session.get(url, timeout=60)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            if attempt == MAX_RETRIES - 1:
                print("  WARN: Failed {}: {}".format(url, e))
                return None
            time.sleep(2 ** attempt)
    return None


def scrape_listing_page(page):
    """
    Scrape one listing page. Returns list of dicts with:
      id, svg_url, name (from filename), category
    """
    url = "{}/?page={}".format(BASE_URL, page)
    html = fetch(url)
    if not html:
        return []

    drawings = []

    # Pattern: href="/drawing/ID" ... src=/uploads/FILENAME.svg
    cards = re.findall(
        r'href="(?:https?://scidraw\.io)?/drawing/(\d+)".*?'
        r'(?:src=|src=")(/uploads/[^\s"\'<>]+\.svg)',
        html, re.DOTALL
    )

    for drawing_id, svg_path in cards:
        # Extract name from SVG filename
        filename = svg_path.split("/")[-1].replace(".svg", "")
        name = re.sub(r'[_-]', ' ', filename)
        name = re.sub(r'[A-Fa-f0-9]{6,}', '', name)  # Remove hash suffixes
        name = name.strip()

        # Find category near this card
        card_start = html.find("/drawing/{}".format(drawing_id))
        cat_section = html[card_start:card_start + 2000] if card_start >= 0 else ""
        cat_match = re.search(r'href="(?:https?://scidraw\.io)?/category/([^"]+)"', cat_section)
        category = cat_match.group(1) if cat_match else "other"

        drawings.append({
            "id": drawing_id,
            "svg_url": BASE_URL + svg_path,
            "name": name if name else "scidraw-{}".format(drawing_id),
            "category": category,
        })

    return drawings


def download_svg(url, dest_path):
    """Download an SVG file."""
    for attempt in range(MAX_RETRIES):
        try:
            resp = session.get(url, timeout=60)
            if resp.status_code == 404:
                return False
            resp.raise_for_status()

            content = resp.text.strip()
            if "<svg" not in content[:1000].lower():
                return False

            dest_path.parent.mkdir(parents=True, exist_ok=True)
            with open(dest_path, "w", encoding="utf-8") as f:
                f.write(content)
            return True

        except requests.RequestException:
            if attempt == MAX_RETRIES - 1:
                return False
            time.sleep(2 ** attempt)

    return False


def sanitize_filename(name):
    name = re.sub(r'[^\w\s-]', '', name.lower())
    name = re.sub(r'[\s]+', '-', name.strip())
    return name[:80] if name else "unnamed"


def main():
    print("=" * 60)
    print("SciDraw.io Scraper")
    print("=" * 60)

    existing = get_existing_icon_names()
    print("Already have {} icons in library".format(len(existing)))

    DEST_DIR.mkdir(parents=True, exist_ok=True)

    # Phase 1: Collect all drawings from listing pages
    print("\nPhase 1: Scanning listing pages...")
    all_drawings = []
    seen_ids = set()

    for page in range(1, MAX_PAGES + 1):
        drawings = scrape_listing_page(page)
        if not drawings:
            print("  Page {}: empty -> done scanning".format(page))
            break

        new = 0
        for d in drawings:
            if d["id"] not in seen_ids:
                seen_ids.add(d["id"])
                all_drawings.append(d)
                new += 1

        print("  Page {}: {} new drawings (total: {})".format(page, new, len(all_drawings)))
        time.sleep(DELAY)

    print("\nTotal unique drawings found: {}".format(len(all_drawings)))

    # Phase 2: Download SVGs
    print("\nPhase 2: Downloading SVGs...")
    downloaded = 0
    skipped_dupe = 0
    skipped_exists = 0
    failed = 0

    for i, drawing in enumerate(all_drawings, 1):
        name_lower = drawing["name"].lower().strip()

        if name_lower in existing:
            skipped_dupe += 1
            continue

        filename = sanitize_filename(drawing["name"])
        cat_dir = DEST_DIR / drawing["category"]
        dest_path = cat_dir / "{}.svg".format(filename)

        if dest_path.exists():
            skipped_exists += 1
            existing.add(name_lower)
            continue

        if download_svg(drawing["svg_url"], dest_path):
            downloaded += 1
            existing.add(name_lower)
        else:
            failed += 1

        sys.stdout.write(
            "\r  [{}/{}] Downloaded: {} | Dupes: {} | Failed: {}".format(
                i, len(all_drawings), downloaded, skipped_dupe, failed
            )
        )
        sys.stdout.flush()
        time.sleep(SVG_DELAY)

    print("\n")
    print("=" * 60)
    print("DONE")
    print("  Downloaded: {}".format(downloaded))
    print("  Skipped (duplicate name): {}".format(skipped_dupe))
    print("  Skipped (file exists): {}".format(skipped_exists))
    print("  Failed: {}".format(failed))
    print("  Saved to: {}".format(DEST_DIR))
    print("=" * 60)


if __name__ == "__main__":
    main()
