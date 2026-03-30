# api/routes/export.py — POST /export (SVG → PNG/PDF conversion)

from fastapi import APIRouter, Depends
from api.dependencies import get_current_user

router = APIRouter()


@router.post("/")
async def export_figure(user=Depends(get_current_user)):
    """
    Export a figure to PNG or PDF.

    Request body:
        svg_content: str — The SVG to convert
        format: str — 'svg' | 'png' | 'pdf'
        dpi: int — Resolution (72, 150, 300)
    """
    # TODO: Parse request body
    # TODO: If free plan, add watermark via services/export/watermark.py
    # TODO: Convert SVG via cairosvg (services/export/svg_to_png.py or svg_to_pdf.py)
    # TODO: Upload result to R2 (services/storage/r2_client.py)
    # TODO: Return signed download URL
    # TODO: Consider making this a Celery async task for large exports

    _ = user
    return {"download_url": "https://placeholder.bora.ai/export/file.png"}
