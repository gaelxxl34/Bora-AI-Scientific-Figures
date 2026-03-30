# services/ai/icon_injector.py — Fetches and injects icon SVGs into prompt
# Retrieves full SVG content for search-matched icons from R2

from typing import List

# TODO: Fetch SVG files from Cloudflare R2 for each matched icon
# TODO: Inject SVG code blocks into the system prompt


async def fetch_icon_svgs(icon_ids: List[str]) -> List[str]:
    """
    Fetch SVG content for a list of icon IDs from Cloudflare R2.
    Returns list of SVG strings ready for prompt injection.
    """
    # TODO: For each icon_id:
    #   1. Look up r2_key from icons table
    #   2. Fetch SVG content from R2 (or Redis cache)
    #   3. Return list of SVG strings
    _ = icon_ids
    return []


async def prepare_icon_context(icon_ids: List[str]) -> str:
    """
    Fetch icons and format them for inclusion in the system prompt.
    """
    svgs = await fetch_icon_svgs(icon_ids)
    # TODO: Wrap each SVG with metadata (name, id) for Claude's reference
    return "\n".join(svgs)
