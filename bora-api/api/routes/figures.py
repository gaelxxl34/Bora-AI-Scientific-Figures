# api/routes/figures.py — Figure CRUD endpoints
# POST /figures, GET /figures, GET /figures/:id, PATCH /figures/:id, DELETE /figures/:id

from fastapi import APIRouter, Depends
from api.dependencies import get_db, get_current_user

router = APIRouter()


@router.get("/")
async def list_figures(user=Depends(get_current_user), db=Depends(get_db)):
    """List all figures for the current user."""
    # TODO: Query figures table filtered by user_id
    _ = user, db
    return {"figures": []}


@router.get("/{figure_id}")
async def get_figure(figure_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Get a single figure by ID."""
    # TODO: Query figure by ID, verify ownership
    _ = user, db
    return {"id": figure_id, "title": "Placeholder", "svg_content": ""}


@router.post("/")
async def create_figure(user=Depends(get_current_user), db=Depends(get_db)):
    """Create a new empty figure."""
    # TODO: Insert new figure row in DB
    _ = user, db
    return {"id": "new-figure-id", "title": "Untitled Figure"}


@router.patch("/{figure_id}")
async def update_figure(figure_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Update figure content or metadata."""
    # TODO: Update figure row (svg_content, title, tags, etc.)
    _ = user, db
    return {"id": figure_id, "updated": True}


@router.delete("/{figure_id}")
async def delete_figure(figure_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Delete a figure."""
    # TODO: Soft delete or hard delete figure row
    _ = user, db
    return {"id": figure_id, "deleted": True}
