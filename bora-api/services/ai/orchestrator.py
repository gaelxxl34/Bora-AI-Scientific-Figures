# services/ai/orchestrator.py — Main AI pipeline coordinator
# Coordinates: icon search → prompt building → Claude call → SVG validation

import os
import json
import logging
from typing import AsyncGenerator, Optional

from services.ai.prompt_builder import build_generation_prompt, build_edit_prompt
from services.ai.svg_validator import validate_svg, sanitize_svg

logger = logging.getLogger(__name__)


async def generate_figure(
    prompt: str,
    figure_id: Optional[str] = None,
    canvas_state: Optional[str] = None,
    current_svg: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Main AI generation pipeline.
    Returns an async generator that yields SSE-formatted JSON chunks.
    """
    # Step 1 — Build the prompt
    if current_svg:
        system_prompt, user_prompt = build_edit_prompt(prompt, current_svg)
    else:
        # Icon injection can be wired in later via icon_injector
        system_prompt, user_prompt = build_generation_prompt(prompt)

    # Step 2 — Stream from Claude
    collected_svg = ""
    async for token in _stream_claude(system_prompt, user_prompt):
        collected_svg += token
        yield json.dumps({"type": "token", "content": token})

    # Step 3 — Validate and sanitize after full SVG is collected
    is_valid, error = validate_svg(collected_svg)
    if not is_valid:
        logger.warning("SVG validation failed: %s", error)
        yield json.dumps({"type": "warning", "content": f"SVG validation: {error}"})

    sanitized = sanitize_svg(collected_svg)
    if sanitized != collected_svg:
        logger.info("SVG was sanitized (unsafe content removed)")

    yield json.dumps({"type": "done", "figure_id": figure_id})


async def _stream_claude(
    system_prompt: str,
    user_prompt: str,
) -> AsyncGenerator[str, None]:
    """Stream tokens from Anthropic Claude API."""
    import anthropic

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "sk-ant-placeholder":
        raise RuntimeError("Anthropic API key is not configured")

    client = anthropic.AsyncAnthropic(api_key=api_key)
    model_id = os.getenv("BORA_GENERATION_MODEL", "claude-sonnet-4-20250514")

    async with client.messages.stream(
        model=model_id,
        max_tokens=8192,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
