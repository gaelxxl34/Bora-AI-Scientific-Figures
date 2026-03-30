# services/ai/svg_validator.py — Validates Claude's SVG output
# Ensures the generated SVG is well-formed and safe

import re
from typing import Optional, Tuple


def validate_svg(svg_string: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that the SVG string is well-formed and safe.
    Returns (is_valid, error_message).
    """
    if not svg_string or "<svg" not in svg_string:
        return False, "No valid SVG root element found"

    if "</svg>" not in svg_string:
        return False, "SVG is not closed — missing </svg>"

    if 'viewBox' not in svg_string:
        return False, "SVG missing viewBox attribute"

    return True, None


# Patterns for dangerous SVG content
_SCRIPT_RE = re.compile(r"<script[\s>].*?</script>", re.IGNORECASE | re.DOTALL)
_EVENT_HANDLER_RE = re.compile(r'\s+on\w+\s*=\s*["\']', re.IGNORECASE)
_EXTERNAL_REF_RE = re.compile(
    r'(?:href|xlink:href)\s*=\s*["\']https?://', re.IGNORECASE
)


def sanitize_svg(svg_string: str) -> str:
    """
    Remove potentially dangerous content from SVG.
    Strips <script> tags, on* event handlers, and external references.
    """
    result = _SCRIPT_RE.sub("", svg_string)
    result = _EVENT_HANDLER_RE.sub(" ", result)
    result = _EXTERNAL_REF_RE.sub('href="', result)
    return result
