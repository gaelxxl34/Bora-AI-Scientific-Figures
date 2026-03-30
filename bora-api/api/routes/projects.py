# api/routes/projects.py — Project / workspace CRUD

from fastapi import APIRouter, Depends
from api.dependencies import get_db, get_current_user

router = APIRouter()


@router.get("/")
async def list_projects(user=Depends(get_current_user), db=Depends(get_db)):
    """List all projects for the current user."""
    # TODO: Query projects table by user_id
    _ = user, db
    return {"projects": []}


@router.post("/")
async def create_project(user=Depends(get_current_user), db=Depends(get_db)):
    """Create a new project/workspace."""
    # TODO: Insert new project row
    _ = user, db
    return {"id": "new-project-id", "name": "Untitled Project"}


@router.get("/{project_id}")
async def get_project(project_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Get a project by ID with its figures."""
    # TODO: Query project + associated figures
    _ = user, db
    return {"id": project_id, "name": "Placeholder", "figures": []}


@router.patch("/{project_id}")
async def update_project(project_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Update project metadata."""
    # TODO: Update project row
    _ = user, db
    return {"id": project_id, "updated": True}


@router.delete("/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Delete a project and its figures."""
    # TODO: Delete project + cascade figures
    _ = user, db
    return {"id": project_id, "deleted": True}
