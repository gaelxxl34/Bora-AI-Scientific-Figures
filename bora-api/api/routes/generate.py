# api/routes/generate.py — POST /generate (SSE streaming endpoint)
# Main AI figure generation endpoint with Server-Sent Events

import json
import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from api.dependencies import get_current_user, rate_limit
from schemas.generate import GenerateRequest
from services.ai.orchestrator import generate_figure

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/")
async def generate(
    request: GenerateRequest,
    user=Depends(get_current_user),
    _rate_ok=Depends(rate_limit),
):
    """
    Generate a scientific figure via AI.
    Streams SVG tokens back to the client via SSE.
    """
    _ = user

    async def event_stream():
        try:
            async for chunk in generate_figure(
                prompt=request.prompt,
                figure_id=request.figure_id,
                canvas_state=request.canvas_state,
                current_svg=request.current_svg,
            ):
                yield f"data: {chunk}\n\n"
        except RuntimeError as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        except Exception as e:
            logger.error("Generation error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'content': 'An unexpected error occurred during generation.'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
