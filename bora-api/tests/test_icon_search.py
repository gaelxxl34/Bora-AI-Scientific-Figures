# tests/test_icon_search.py — Tests for icon semantic search

import pytest


class TestIconSearch:
    """Tests for GET /icons/search"""

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_search_returns_icons(self):
        """Test that search returns relevant icons."""
        # TODO: GET /icons/search?q=mitochondria
        # TODO: Assert response contains icons list
        pass

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_search_empty_query(self):
        """Test that empty query returns validation error."""
        # TODO: GET /icons/search?q=
        # TODO: Assert 422 response
        pass

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_search_result_fields(self):
        """Test that each icon result has required fields."""
        # TODO: Assert each result has: id, name, category, thumbnail_url
        pass
