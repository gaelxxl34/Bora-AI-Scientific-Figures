# tasks/embed_tasks.py — Background icon embedding via Celery

from typing import Dict, List

from tasks.celery_app import celery_app


@celery_app.task
def embed_icon_task(icon_id: str, description: str) -> dict:
    """
    Background task to generate embedding for a single icon.
    Used during icon ingestion pipeline.
    """
    # TODO: from services.icons.embedder import embed_text
    # TODO: embedding = embed_text(description)
    # TODO: Update icon row in DB with embedding vector
    _ = icon_id, description
    return {"icon_id": icon_id, "status": "embedded"}


@celery_app.task
def embed_icons_batch(icons: List[dict]) -> dict:
    """
    Background task to embed a batch of icons.
    More efficient than individual embedding tasks.
    """
    # TODO: from services.icons.embedder import embed_batch
    # TODO: Batch embed all descriptions
    # TODO: Bulk update icon rows in DB
    return {"count": len(icons), "status": "complete"}
