# api/routes/auth.py — Auth + Admin endpoints (Supabase)

import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from api.dependencies import get_current_user, require_admin, require_super_admin

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _supa_headers():
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


@router.get("/me")
async def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    """Return the currently authenticated user's info."""
    return user


# ── Admin: User Management ──────────────────────────────────

@router.get("/admin/users")
async def list_users(admin: Dict[str, Any] = Depends(require_admin)):
    """List all users with their profiles."""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc",
            headers=_supa_headers(),
        )
    if res.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch users")
    return res.json()


class UpdateUserRole(BaseModel):
    role: str  # user | admin | super_admin


@router.patch("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    body: UpdateUserRole,
    admin: Dict[str, Any] = Depends(require_super_admin),
):
    """Update a user's role. Super admin only."""
    if body.role not in ("user", "admin", "super_admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    async with httpx.AsyncClient() as client:
        res = await client.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=_supa_headers(),
            json={"role": body.role},
        )
    if res.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Failed to update role")
    return {"updated": True}


class UpdateUserPlan(BaseModel):
    plan: str  # free | pro | lab


@router.patch("/admin/users/{user_id}/plan")
async def update_user_plan(
    user_id: str,
    body: UpdateUserPlan,
    admin: Dict[str, Any] = Depends(require_admin),
):
    """Update a user's plan."""
    if body.plan not in ("free", "pro", "lab"):
        raise HTTPException(status_code=400, detail="Invalid plan")
    async with httpx.AsyncClient() as client:
        res = await client.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=_supa_headers(),
            json={"plan": body.plan},
        )
    if res.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Failed to update plan")
    return {"updated": True}


@router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: Dict[str, Any] = Depends(require_super_admin),
):
    """Delete a user. Super admin only."""
    async with httpx.AsyncClient() as client:
        # Delete from Supabase Auth (cascades to profiles via FK)
        res = await client.delete(
            f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
            headers=_supa_headers(),
        )
    if res.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Failed to delete user")
    return {"deleted": True}


# ── Admin: Analytics ─────────────────────────────────────────

@router.get("/admin/stats")
async def get_stats(admin: Dict[str, Any] = Depends(require_admin)):
    """Get platform statistics."""
    headers = _supa_headers()
    async with httpx.AsyncClient() as client:
        users_res = await client.get(
            f"{SUPABASE_URL}/rest/v1/profiles?select=id",
            headers={**headers, "Prefer": "count=exact"},
        )
        figures_res = await client.get(
            f"{SUPABASE_URL}/rest/v1/figures?select=id",
            headers={**headers, "Prefer": "count=exact"},
        )
        logs_res = await client.get(
            f"{SUPABASE_URL}/rest/v1/generation_logs?select=id",
            headers={**headers, "Prefer": "count=exact"},
        )

    def extract_count(r: httpx.Response) -> int:
        # Supabase returns count in content-range header
        cr = r.headers.get("content-range", "")
        if "/" in cr:
            try:
                return int(cr.split("/")[1])
            except (ValueError, IndexError):
                pass
        return len(r.json()) if r.status_code == 200 else 0

    return {
        "total_users": extract_count(users_res),
        "total_figures": extract_count(figures_res),
        "total_generations": extract_count(logs_res),
    }


@router.get("/admin/logs")
async def get_generation_logs(
    limit: int = 50,
    admin: Dict[str, Any] = Depends(require_admin),
):
    """Get recent generation logs."""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/generation_logs?select=*,profiles(email,full_name)&order=created_at.desc&limit={limit}",
            headers=_supa_headers(),
        )
    if res.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch logs")
    return res.json()
