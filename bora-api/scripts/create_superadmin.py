#!/usr/bin/env python3
"""
Create a super_admin user in Supabase.

Usage:
  python scripts/create_superadmin.py --email admin@bora.ai --password YourStrongPassword --name "Admin User"

This script:
  1. Creates a user in Supabase Auth (email + password)
  2. Sets their profile role to super_admin
"""

import os
import sys
import argparse
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


def create_superadmin(email: str, password: str, name: str):
    # 1. Create user via Supabase Admin Auth API
    print(f"Creating user {email}...")
    res = httpx.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=HEADERS,
        json={
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": name},
        },
    )

    if res.status_code == 422 and "already been registered" in res.text:
        print(f"User {email} already exists — updating role to super_admin...")
        # Fetch user by email
        list_res = httpx.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=HEADERS,
            params={"page": 1, "per_page": 1000},
        )
        users = list_res.json().get("users", [])
        user = next((u for u in users if u.get("email") == email), None)
        if not user:
            print("ERROR: Could not find existing user")
            sys.exit(1)
        user_id = user["id"]
    elif res.status_code not in (200, 201):
        print(f"ERROR creating user: {res.status_code} {res.text}")
        sys.exit(1)
    else:
        user_id = res.json()["id"]
        print(f"User created: {user_id}")

    # 2. Update profile to super_admin
    print("Setting role to super_admin...")
    update_res = httpx.patch(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json={"role": "super_admin"},
    )

    if update_res.status_code in (200, 204):
        print(f"Done! {email} is now a super_admin.")
    else:
        print(f"WARNING: Profile update returned {update_res.status_code}: {update_res.text}")
        print("You may need to run the SQL migration first, or manually update:")
        print(f"  UPDATE profiles SET role = 'super_admin' WHERE id = '{user_id}';")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a Bora super admin user")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--password", required=True, help="Admin password (min 6 chars)")
    parser.add_argument("--name", default="Super Admin", help="Full name")
    args = parser.parse_args()

    if len(args.password) < 6:
        print("ERROR: Password must be at least 6 characters")
        sys.exit(1)

    create_superadmin(args.email, args.password, args.name)
