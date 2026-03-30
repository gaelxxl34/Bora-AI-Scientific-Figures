# tests/test_generate.py — Tests for the AI generation endpoint

import pytest


class TestGenerateEndpoint:
    """Tests for POST /generate"""

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_generate_returns_sse_stream(self):
        """Test that /generate returns a valid SSE stream."""
        # TODO: POST to /generate with a test prompt
        # TODO: Assert response is text/event-stream
        # TODO: Assert SVG content in stream
        pass

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_generate_requires_auth(self):
        """Test that /generate requires authentication."""
        # TODO: POST without auth header
        # TODO: Assert 401 response
        pass

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_generate_rate_limited(self):
        """Test that free users are rate limited."""
        # TODO: Exhaust rate limit
        # TODO: Assert 429 response
        pass

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_generate_edit_mode(self):
        """Test targeted edit mode with current_svg provided."""
        # TODO: POST with current_svg and edit instruction
        # TODO: Assert patch-mode response
        pass
