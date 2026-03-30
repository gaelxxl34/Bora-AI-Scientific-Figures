# services/export/watermark.py — Add 'made with bora' watermark to free tier exports

# TODO: Inject watermark text element into SVG before export conversion


def add_watermark(svg_content: str) -> str:
    """
    Add a 'made with bora' text watermark to the bottom-right of the SVG.
    Applied only for free-tier users.
    """
    # TODO: Parse SVG with lxml
    # TODO: Add <text> element with watermark text
    # TODO: Position in bottom-right corner
    # TODO: Return modified SVG string
    _ = svg_content
    return svg_content
