#!/usr/bin/env python3
"""
Reactome Icon Library Scraper
=============================
Scrapes ~2,500 SVG icons from https://reactome.org/icon-lib

Strategy:
  1. Hit each category listing page (with pagination)
  2. Extract R-ICO-XXXXXX identifiers from the HTML
  3. Download SVG from https://reactome.org/icon/{id}.svg
  4. Skip icons whose names already exist in our library

License: CC BY 4.0
"""

import os
import re
import sys
import time
import hashlib
import requests
from pathlib import Path
from urllib.parse import quote

# --- Configuration ---
CATEGORIES = [
    "arrow", "background", "cell_element", "cell_type",
    "compound", "human_tissue", "protein", "receptor",
    "therapeutic", "transporter",
]
BASE_URL = "https://reactome.org"
ICON_LIB_URL = f"{BASE_URL}/icon-lib"
ICON_SVG_URL = f"{BASE_URL}/icon"
DETAIL_URL = f"{BASE_URL}/content/detail"

# Where to save
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ICONS = SCRIPT_DIR.parent.parent / "public" / "icons"
DEST_DIR = PROJECT_ICONS / "reactome"

# Rate limiting
DELAY_BETWEEN_REQUESTS = 0.3  # seconds
MAX_RETRIES = 3

session = requests.Session()
session.headers.update({
    "User-Agent": "Bora-AI-Scientific-Figure-Builder/1.0 (educational project)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
})


def get_existing_icon_names():
    """Collect names of icons we already have to avoid duplicates."""
    names = set()
    manifest_path = PROJECT_ICONS / "manifest.json"
    if manifest_path.exists():
        import json
        with open(manifest_path) as f:
            for icon in json.load(f):
                names.add(icon["name"].lower().strip())
    return names


def scrape_category_page(category, page=1):
    """Scrape one page of a category listing. Returns list of {id, name}."""
    # Reactome uses the display name in the URL with spaces encoded
    url = f"{ICON_LIB_URL}/{quote(category)}?page={page}"
    icons = []

    for attempt in range(MAX_RETRIES):
        try:
            resp = session.get(url, timeout=30)
            if resp.status_code == 404:
                return []
            resp.raise_for_status()
            break
        except requests.RequestException as e:
            if attempt == MAX_RETRIES - 1:
                print(f"  WARN: Failed to fetch {url}: {e}")
                return []
            time.sleep(2 ** attempt)

    html = resp.text

    # Extract R-ICO-XXXXXX IDs and their names from the page
    # HTML pattern: <a href="/content/detail/R-ICO-XXXXXX">
    #                 <img src="/icon/R-ICO-XXXXXX.svg" alt="Icon Name" ...>
    for match in re.finditer(
        r'href="/content/detail/(R-ICO-\d+)"[^>]*>\s*<img[^>]*alt="([^"]+)"',
        html,
    ):
        ico_id = match.group(1)
        name = match.group(2).strip()
        if ico_id and name:
            icons.append({"id": ico_id, "name": name})

    # Fallback: if alt-based extraction found nothing, just grab all R-ICO IDs
    if not icons:
        for ico_id in set(re.findall(r'(R-ICO-\d+)', html)):
            icons.append({"id": ico_id, "name": ico_id})

    # Deduplicate (page sometimes repeats icons in thumbnails)
    seen = set()
    unique = []
    for icon in icons:
        if icon["id"] not in seen:
            seen.add(icon["id"])
            unique.append(icon)

    return unique


def get_max_page(category):
    """Detect the last page number for a category."""
    url = f"{ICON_LIB_URL}/{quote(category)}"
    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
    except requests.RequestException:
        return 1

    # Find pagination links like ?page=8
    pages = re.findall(r'\?page=(\d+)', resp.text)
    if pages:
        return max(int(p) for p in pages)
    return 1


def download_svg(ico_id, dest_path):
    """Download a single SVG icon."""
    url = f"{ICON_SVG_URL}/{ico_id}.svg"

    for attempt in range(MAX_RETRIES):
        try:
            resp = session.get(url, timeout=30)
            if resp.status_code == 404:
                return False
            resp.raise_for_status()

            content = resp.text.strip()
            if not content.startswith("<?xml") and not content.startswith("<svg"):
                return False

            dest_path.parent.mkdir(parents=True, exist_ok=True)
            with open(dest_path, "w", encoding="utf-8") as f:
                f.write(content)
            return True

        except requests.RequestException as e:
            if attempt == MAX_RETRIES - 1:
                print(f"  WARN: Failed to download {url}: {e}")
                return False
            time.sleep(2 ** attempt)

    return False


def sanitize_filename(name):
    """Convert icon name to a safe filename."""
    name = re.sub(r'[^\w\s-]', '', name.lower())
    name = re.sub(r'[\s]+', '-', name.strip())
    return name[:80] if name else "unnamed"


def main():
    print("=" * 60)
    print("Reactome Icon Library Scraper")
    print("=" * 60)

    existing_names = get_existing_icon_names()
    print(f"Already have {len(existing_names)} icons in library")

    DEST_DIR.mkdir(parents=True, exist_ok=True)

    total_downloaded = 0
    total_skipped = 0
    total_failed = 0
    total_duplicate = 0

    for cat in CATEGORIES:
        print(f"\n--- Category: {cat} ---")
        cat_dir = DEST_DIR / cat

        # Get total pages
        max_page = get_max_page(cat)
        print(f"  Pages: {max_page}")
        time.sleep(DELAY_BETWEEN_REQUESTS)

        # Collect all icons in this category
        all_icons = []
        for page in range(1, max_page + 1):
            icons = scrape_category_page(cat, page)
            all_icons.extend(icons)
            time.sleep(DELAY_BETWEEN_REQUESTS)

        print(f"  Found {len(all_icons)} icons")

        # Download each
        for icon in all_icons:
            name_lower = icon["name"].lower().strip()

            # Skip if we already have this by name
            if name_lower in existing_names:
                total_duplicate += 1
                continue

            filename = sanitize_filename(icon["name"])
            dest_path = cat_dir / f"{filename}.svg"

            # Skip if already downloaded in a previous run
            if dest_path.exists():
                total_skipped += 1
                existing_names.add(name_lower)
                continue

            if download_svg(icon["id"], dest_path):
                total_downloaded += 1
                existing_names.add(name_lower)
                sys.stdout.write(f"\r  Downloaded: {total_downloaded} | Dupes: {total_duplicate} | Failed: {total_failed}")
                sys.stdout.flush()
            else:
                total_failed += 1

            time.sleep(DELAY_BETWEEN_REQUESTS)

        print()  # newline after progress

    print(f"\n{'=' * 60}")
    print(f"DONE")
    print(f"  Downloaded: {total_downloaded}")
    print(f"  Skipped (already existed): {total_skipped}")
    print(f"  Duplicates (name match): {total_duplicate}")
    print(f"  Failed: {total_failed}")
    print(f"  Saved to: {DEST_DIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
