# services/ai/svg_patcher.py — Applies targeted edits to existing SVG
# Merges Claude's partial SVG patch into the existing figure

# TODO: Parse current SVG and patch SVG with lxml
# TODO: Match elements by ID
# TODO: Replace/add/remove matched elements


def apply_patch(current_svg: str, patch_svg: str) -> str:
    """
    Apply a partial SVG patch to an existing SVG document.
    Claude returns only modified elements; this merges them into the full SVG.
    """
    # TODO: Parse both SVGs with lxml
    # TODO: For each element in patch:
    #   - If element ID exists in current: replace it
    #   - If element ID is new: append it
    # TODO: Return merged SVG string
    _ = patch_svg
    return current_svg
