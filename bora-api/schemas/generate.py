# schemas/generate.py — Pydantic schemas for AI generation

from typing import Optional

from pydantic import BaseModel


class GenerateRequest(BaseModel):
    prompt: str
    figure_id: Optional[str] = None
    canvas_state: Optional[str] = None
    current_svg: Optional[str] = None


class GenerateResponse(BaseModel):
    figure_id: str
    svg_content: str
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None
