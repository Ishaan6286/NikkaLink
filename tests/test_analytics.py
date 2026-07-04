"""
Tests for analytics endpoints.

Covers:
  - Click tracking (redirect increments clicks)
  - Analytics dashboard response
  - Click list pagination
  - Ownership check (403 for other user's URLs)
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


class TestAnalytics:
    """Tests for /api/v1/analytics endpoints."""

    async def _setup_url_with_clicks(
        self,
        client: AsyncClient,
    ) -> tuple[str, dict]:
        """Helper: create user, URL, and generate some clicks."""
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

        # Create URL
        create_resp = await client.post(
            "/api/v1/urls",
            json={
                "original_url": "https://www.example.com/analytics",
                "custom_alias": f"analytics-{unique}",
            },
            headers=headers,
        )
        short_code = create_resp.json()["short_code"]

        # Generate clicks by hitting the redirect endpoint
        for _ in range(3):
            await client.get(f"/{short_code}", follow_redirects=False)

        return short_code, headers

    async def test_analytics_dashboard(self, client: AsyncClient) -> None:
        short_code, headers = await self._setup_url_with_clicks(client)

        response = await client.get(
            f"/api/v1/analytics/{short_code}",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["short_code"] == short_code
        assert data["total_clicks"] >= 3
        assert "unique_visitors" in data
        assert "browsers" in data
        assert "devices" in data
        assert "operating_systems" in data
        assert "time_series" in data

    async def test_analytics_clicks_list(self, client: AsyncClient) -> None:
        short_code, headers = await self._setup_url_with_clicks(client)

        response = await client.get(
            f"/api/v1/analytics/{short_code}/clicks?page=1&page_size=10",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["total"] >= 3

    async def test_analytics_timeseries(self, client: AsyncClient) -> None:
        short_code, headers = await self._setup_url_with_clicks(client)

        response = await client.get(
            f"/api/v1/analytics/{short_code}/timeseries?days=7",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_analytics_unauthorized(self, client: AsyncClient) -> None:
        """User A should not see analytics for User B's URL."""
        # Create URL as User A
        short_code, _ = await self._setup_url_with_clicks(client)

        # Register User B
        unique_b = uuid.uuid4().hex[:8]
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"b{unique_b}@example.com",
                "username": f"userb{unique_b}",
                "password": "StrongPass123!",
            },
        )
        login_b = await client.post(
            "/api/v1/auth/login",
            json={"email": f"b{unique_b}@example.com", "password": "StrongPass123!"},
        )
        headers_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}

        # User B tries to access User A's analytics
        response = await client.get(
            f"/api/v1/analytics/{short_code}",
            headers=headers_b,
        )
        assert response.status_code == 403
