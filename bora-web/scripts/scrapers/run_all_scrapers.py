#!/usr/bin/env python3
"""
Master Icon Scraper Runner
===========================
Run all scraper scripts and rebuild the icon manifest.

Usage:
  python run_all_scrapers.py              # Run all
  python run_all_scrapers.py reactome     # Run only Reactome
  python run_all_scrapers.py scidraw      # Run only SciDraw
  python run_all_scrapers.py servier      # Run only Servier
  python run_all_scrapers.py manifest     # Only rebuild manifest

Prerequisites:
  pip install requests beautifulsoup4 python-pptx
  brew install --cask libreoffice  # (optional, for Servier EMF→SVG)
"""

import sys
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
MANIFEST_SCRIPT = SCRIPT_DIR.parent / "build-icon-manifest.cjs"

SCRAPERS = {
    "reactome": SCRIPT_DIR / "scrape_reactome.py",
    "scidraw": SCRIPT_DIR / "scrape_scidraw.py",
    "servier": SCRIPT_DIR / "convert_servier.py",
}


def run_scraper(name: str, path: Path):
    print(f"\n{'#' * 60}")
    print(f"# Running: {name}")
    print(f"{'#' * 60}\n")
    subprocess.run([sys.executable, str(path)], check=False)


def rebuild_manifest():
    print(f"\n{'#' * 60}")
    print(f"# Rebuilding icon manifest")
    print(f"{'#' * 60}\n")
    subprocess.run(["node", str(MANIFEST_SCRIPT)], check=False)


def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(SCRAPERS.keys()) + ["manifest"]

    for target in targets:
        if target == "manifest":
            rebuild_manifest()
        elif target in SCRAPERS:
            run_scraper(target, SCRAPERS[target])
        else:
            print(f"Unknown target: {target}")
            print(f"Valid targets: {', '.join(SCRAPERS.keys())}, manifest")
            sys.exit(1)

    # Always rebuild manifest unless only running manifest
    if "manifest" not in targets:
        rebuild_manifest()

    print("\n✓ All done!")


if __name__ == "__main__":
    main()
