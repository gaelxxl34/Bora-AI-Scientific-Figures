# tests/test_svg_validator.py — Tests for SVG validation and sanitization

import pytest
from services.ai.svg_validator import validate_svg, sanitize_svg


class TestSvgValidator:
    """Tests for SVG validation logic."""

    def test_valid_svg_passes(self):
        """Test that a well-formed SVG passes validation."""
        svg = '<svg viewBox="0 0 100 100"><rect width="50" height="50"/></svg>'
        is_valid, error = validate_svg(svg)
        assert is_valid is True
        assert error is None

    def test_empty_string_fails(self):
        """Test that empty string fails validation."""
        is_valid, error = validate_svg("")
        assert is_valid is False
        assert error is not None

    def test_no_svg_element_fails(self):
        """Test that string without <svg> fails."""
        is_valid, error = validate_svg("<div>not svg</div>")
        assert is_valid is False

    @pytest.mark.skip(reason="Placeholder — sanitize not yet implemented")
    def test_sanitize_removes_script(self):
        """Test that <script> tags are removed."""
        svg = '<svg><script>alert("xss")</script><rect/></svg>'
        clean = sanitize_svg(svg)
        assert "<script>" not in clean
