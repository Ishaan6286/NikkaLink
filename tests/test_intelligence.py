"""Tests for link intelligence utilities and services."""

from __future__ import annotations

import pytest

from app.core.exceptions import ValidationError
from app.utils.url_normalize import normalize_url
from app.utils.url_safety import validate_external_url


class TestURLSafety:
    def test_rejects_localhost(self):
        with pytest.raises(ValidationError):
            validate_external_url("http://localhost:8000/test")

    def test_rejects_file_scheme(self):
        with pytest.raises(ValidationError):
            validate_external_url("file:///etc/passwd")

    def test_accepts_valid_https(self):
        result = validate_external_url("https://example.com/page")
        assert result == "https://example.com/page"

    def test_rejects_private_ip_literal(self):
        with pytest.raises(ValidationError):
            validate_external_url("http://127.0.0.1/admin")


class TestURLNormalize:
    def test_strips_trailing_slash(self):
        assert normalize_url("https://example.com/path/") == normalize_url(
            "https://example.com/path"
        )

    def test_removes_utm_params(self):
        normalized = normalize_url(
            "https://example.com/page?utm_source=twitter&id=1"
        )
        assert "utm_source" not in normalized
        assert "id=1" in normalized

    def test_same_url_different_tracking(self):
        a = normalize_url("https://Example.com/page?utm_source=a")
        b = normalize_url("https://example.com/page?utm_source=b")
        assert a == b
