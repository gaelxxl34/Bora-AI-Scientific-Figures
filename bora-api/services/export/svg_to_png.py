# services/export/svg_to_png.py — Convert SVG to PNG using cairosvg

# TODO: Use cairosvg.svg2png() for conversion
# TODO: Support DPI settings (72, 150, 300)


def convert_svg_to_png(svg_content: str, dpi: int = 300) -> bytes:
    """
    Convert SVG string to PNG bytes at specified DPI.
    """
    # TODO: import cairosvg
    # TODO: scale = dpi / 96  # cairosvg default is 96 DPI
    # TODO: return cairosvg.svg2png(bytestring=svg_content.encode(), scale=scale)
    _ = svg_content, dpi
    return b""
