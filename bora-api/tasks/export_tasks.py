# tasks/export_tasks.py — Async PDF/PNG generation via Celery

from tasks.celery_app import celery_app


@celery_app.task
def export_figure_task(svg_content: str, format: str, dpi: int, user_id: str) -> dict:
    """
    Async task to convert SVG to PNG/PDF and upload to R2.
    Returns the download URL.
    """
    # TODO: Apply watermark if free user
    # TODO: Convert SVG using cairosvg
    # TODO: Upload to R2
    # TODO: Return signed URL
    _ = svg_content, format, dpi, user_id
    return {"download_url": "https://placeholder.bora.ai/export/file.png", "status": "complete"}
