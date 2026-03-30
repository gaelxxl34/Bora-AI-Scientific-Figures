# tests/test_export.py — Tests for export functionality

import pytest


class TestExport:
    """Tests for POST /export"""

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_export_png(self):
        """Test PNG export returns a download URL."""
        # TODO: POST /export with SVG content, format=png, dpi=300
        # TODO: Assert download_url in response
        pass

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_export_pdf(self):
        """Test PDF export returns a download URL."""
        # TODO: POST /export with format=pdf
        pass

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_export_adds_watermark_for_free(self):
        """Test that free-tier exports include watermark."""
        # TODO: Export as free user
        # TODO: Assert watermark text present in SVG before conversion
        pass

    @pytest.mark.skip(reason="Placeholder — not yet implemented")
    def test_export_no_watermark_for_pro(self):
        """Test that pro-tier exports have no watermark."""
        pass
