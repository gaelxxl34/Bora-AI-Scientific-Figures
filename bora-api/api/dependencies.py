# api/dependencies.py — Shared FastAPI dependencies

import os
import jwt
import httpx
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import SessionLocal

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


async def get_db():
    """Yield an async SQLAlchemy session."""
    async with SessionLocal() as session:
        yield session


async def get_current_user(request: Request) -> Dict[str, Any]:
    """Verify Supabase JWT and return decoded user payload."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = auth_header[7:]
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {
        "id": payload.get("sub"),
        "email": payload.get("email", ""),
        "role": payload.get("user_metadata", {}).get("role", "user"),
    }


async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Require admin or super_admin role."""
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_super_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Require super_admin role."""
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user


async def rate_limit(user: Dict[str, Any] = Depends(get_current_user)):
    """Check rate limit for AI generation calls. TODO: Implement Redis token bucket."""
    plan = user.get("plan", "free")
    if plan == "free":
        pass  # TODO: Check 10 calls/day limit
    return True
