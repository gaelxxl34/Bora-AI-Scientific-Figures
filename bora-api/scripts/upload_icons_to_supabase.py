#!/usr/bin/env python3
"""
Bulk upload all local SVG icons to Supabase Storage.

Creates a public bucket "icons" and uploads every SVG from bora-web/public/icons/.
Generates an updated manifest.json with Supabase Storage URLs.

Usage:
    cd bora-api
    python scripts/upload_icons_to_supabase.py
"""

import os
import json
import sys
import time
from pathlib import Path
from supabase import create_client, Client

# ── Configuration ──
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = "icons"
ICONS_DIR = Path(__file__).resolve().parent.parent.parent / "bora-web" / "public" / "icons"
MANIFEST_PATH = ICONS_DIR / "manifest.json"
OUTPUT_MANIFEST_PATH = ICONS_DIR / "manifest.json"

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
    print("  export SUPABASE_URL=https://xxx.supabase.co")
    print("  export SUPABASE_SERVICE_ROLE_KEY=eyJ...")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def ensure_bucket():
    """Create the icons bucket if it doesn't exist (public, for CDN access)."""
    try:
        supabase.storage.get_bucket(BUCKET_NAME)
        print(f"Bucket '{BUCKET_NAME}' already exists")
    except Exception:
        print(f"Creating public bucket '{BUCKET_NAME}'...")
        supabase.storage.create_bucket(
            BUCKET_NAME,
            options={"public": True, "file_size_limit": 5 * 1024 * 1024},  # 5MB max
        )
        print(f"Bucket '{BUCKET_NAME}' created!")


def get_public_url(storage_path: str) -> str:
    """Build the public URL for a file in the icons bucket."""
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{storage_path}"


def upload_file(local_path: Path, storage_path: str) -> bool:
    """Upload a single SVG file to Supabase Storage. Returns True on success."""
    try:
        with open(local_path, "rb") as f:
            data = f.read()

        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=data,
            file_options={"content-type": "image/svg+xml", "upsert": "true"},
        )
        return True
    except Exception as e:
        err = str(e)
        # "Duplicate" means already uploaded — that's fine
        if "Duplicate" in err or "already exists" in err:
            return True
        print(f"  FAILED {storage_path}: {err}")
        return False


def main():
    ensure_bucket()

    # Load existing manifest
    if not MANIFEST_PATH.exists():
        print(f"ERROR: manifest.json not found at {MANIFEST_PATH}")
        print("Run 'node scripts/build-icon-manifest.cjs' in bora-web/ first")
        sys.exit(1)

    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    print(f"\nFound {len(manifest)} icons in manifest")
    print(f"Icons directory: {ICONS_DIR}\n")

    updated_manifest = []
    uploaded = 0
    skipped = 0
    failed = 0

    for i, entry in enumerate(manifest):
        # entry.path is like "/icons/bioicons/cc-0/Amino-Acids/B--Gideon-Bergheim/alanine.svg"
        local_rel = entry["path"].lstrip("/")  # "icons/bioicons/..."
        local_path = ICONS_DIR.parent / local_rel  # bora-web/public/icons/...

        # Storage path: strip the leading "icons/" to avoid redundancy with bucket name
        storage_path = entry["path"].lstrip("/icons/")
        # Actually, let's keep the full subfolder structure for clarity
        storage_path = local_rel.replace("icons/", "", 1)  # "bioicons/cc-0/..."

        if not local_path.exists():
            print(f"  SKIP (missing): {local_path}")
            skipped += 1
            # Keep old entry as-is
            updated_manifest.append(entry)
            continue

        success = upload_file(local_path, storage_path)

        if success:
            uploaded += 1
            # Update path to Supabase public URL
            new_entry = {
                **entry,
                "path": get_public_url(storage_path),
            }
            updated_manifest.append(new_entry)
        else:
            failed += 1
            updated_manifest.append(entry)  # keep local path as fallback

        # Progress
        if (i + 1) % 100 == 0 or i == len(manifest) - 1:
            print(f"  Progress: {i + 1}/{len(manifest)} (uploaded: {uploaded}, skipped: {skipped}, failed: {failed})")

        # Rate limiting: small pause every 50 uploads to avoid hitting Supabase limits
        if uploaded > 0 and uploaded % 50 == 0:
            time.sleep(0.5)

    # Write updated manifest
    with open(OUTPUT_MANIFEST_PATH, "w") as f:
        json.dump(updated_manifest, f)

    print(f"\nDone!")
    print(f"  Uploaded: {uploaded}")
    print(f"  Skipped:  {skipped}")
    print(f"  Failed:   {failed}")
    print(f"  Manifest updated: {OUTPUT_MANIFEST_PATH}")


if __name__ == "__main__":
    main()
