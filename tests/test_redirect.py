"""
Tests for the public redirect endpoint.

Covers:
  - Successful 302 redirect
  - Expired URL returns 410
  - Deleted URL returns 404
  - Nonexistent short code returns 404
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient


class TestRedirect:
    """Tests for GET /{short_code} (public redirect)."""

    async def _create_url(
        self,
        client: AsyncClient,
        original_url: str = "https://www.example.com",
        custom_alias: str | None = None,
        expires_at: str | None = None,
    ) -> tuple[dict, dict]:
        """Helper: register, login, create URL, return (url_data, headers)."""
        import uuid

        unique = uuid.uuid4().hex[:8]
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"{unique}@example.com",
                "username": f"user{unique}",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": f"{unique}@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        body: dict = {"original_url": original_url}
        if custom_alias:
            body["custom_alias"] = custom_alias
        if expires_at:
            body["expires_at"] = expires_at

        create_resp = await client.post("/api/v1/urls", json=body, headers=headers)
        return create_resp.json(), headers

    async def test_redirect_success(self, client: AsyncClient) -> None:
        url_data, _ = await self._create_url(
            client,
            original_url="https://www.google.com",
            custom_alias="redir-test",
        )
        response = await client.get(
            f"/{url_data['short_code']}",
            follow_redirects=False,
        )
        assert response.status_code == 302
        assert response.headers["location"] == "https://www.google.com"

    async def test_redirect_nonexistent(self, client: AsyncClient) -> None:
        response = await client.get("/nonexistent-code", follow_redirects=False)
        assert response.status_code == 404

    async def test_redirect_deleted_url(self, client: AsyncClient) -> None:
        url_data, headers = await self._create_url(
            client,
            custom_alias="del-redir",
        )
        # Delete it
        await client.delete(
            f"/api/v1/urls/{url_data['short_code']}",
            headers=headers,
        )
        # Try redirect
        response = await client.get(
            f"/{url_data['short_code']}",
            follow_redirects=False,
        )
        assert response.status_code == 404

    async def test_redirect_expired_url(self, client: AsyncClient) -> None:
        # Create URL that expires in the past
        past = (datetime.now(UTC) - timedelta(hours=1)).isoformat()
        url_data, _ = await self._create_url(
            client,
            custom_alias="exp-redir",
            expires_at=past,
        )
        response = await client.get(
            f"/{url_data['short_code']}",
            follow_redirects=False,
        )
        assert response.status_code == 410
