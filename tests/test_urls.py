"""
Tests for URL shortening endpoints.

Covers:
  - Create short URL
  - Custom alias
  - Duplicate alias conflict
  - URL validation
  - Bulk create
  - List with pagination/sorting/search
  - Update URL
  - Soft delete
  - Tags
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestCreateURL:
    """Tests for POST /api/v1/urls."""

    async def test_create_url_success(self, client: AsyncClient) -> None:
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "urluser@example.com",
                "username": "urluser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "urluser@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = await client.post(
            "/api/v1/urls",
            json={"original_url": "https://www.example.com/very/long/path"},
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert "short_code" in data
        assert "short_url" in data
        assert data["original_url"] == "https://www.example.com/very/long/path"
        assert data["is_active"] is True
        assert data["total_clicks"] == 0

    async def test_create_url_custom_alias(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "alias@example.com",
                "username": "aliasuser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "alias@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = await client.post(
            "/api/v1/urls",
            json={
                "original_url": "https://www.example.com",
                "custom_alias": "my-custom",
            },
            headers=headers,
        )
        assert response.status_code == 201
        assert response.json()["short_code"] == "my-custom"

    async def test_create_url_duplicate_alias(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "dup@example.com",
                "username": "dupuser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "dup@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        # Create first URL with alias
        await client.post(
            "/api/v1/urls",
            json={"original_url": "https://example.com", "custom_alias": "taken"},
            headers=headers,
        )

        # Try same alias again
        response = await client.post(
            "/api/v1/urls",
            json={"original_url": "https://example.org", "custom_alias": "taken"},
            headers=headers,
        )
        assert response.status_code == 409

    async def test_create_url_invalid_url(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "inv@example.com",
                "username": "invuser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "inv@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = await client.post(
            "/api/v1/urls",
            json={"original_url": "not-a-valid-url"},
            headers=headers,
        )
        assert response.status_code == 422

    async def test_create_url_unauthenticated(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/urls",
            json={"original_url": "https://www.example.com"},
        )
        assert response.status_code in (401, 422)

    async def test_create_url_with_tags(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "tags@example.com",
                "username": "taguser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "tags@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = await client.post(
            "/api/v1/urls",
            json={
                "original_url": "https://example.com",
                "tags": ["Marketing", "Social"],
            },
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert "marketing" in data["tags"]
        assert "social" in data["tags"]


class TestBulkCreate:
    """Tests for POST /api/v1/urls/bulk."""

    async def test_bulk_create(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "bulk@example.com",
                "username": "bulkuser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "bulk@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = await client.post(
            "/api/v1/urls/bulk",
            json={
                "urls": [
                    {"original_url": "https://example.com/1"},
                    {"original_url": "https://example.com/2"},
                    {"original_url": "https://example.com/3"},
                ]
            },
            headers=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["created"]) == 3


class TestListURLs:
    """Tests for GET /api/v1/urls."""

    async def test_list_urls_paginated(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "list@example.com",
                "username": "listuser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "list@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        # Create a few URLs
        for i in range(5):
            await client.post(
                "/api/v1/urls",
                json={"original_url": f"https://example.com/{i}"},
                headers=headers,
            )

        # Get first page
        response = await client.get(
            "/api/v1/urls?page=1&page_size=2",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["total_pages"] == 3


class TestUpdateURL:
    """Tests for PATCH /api/v1/urls/{short_code}."""

    async def test_update_url(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "upd@example.com",
                "username": "upduser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "upd@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        # Create
        create_resp = await client.post(
            "/api/v1/urls",
            json={"original_url": "https://old.example.com"},
            headers=headers,
        )
        short_code = create_resp.json()["short_code"]

        # Update
        response = await client.patch(
            f"/api/v1/urls/{short_code}",
            json={"original_url": "https://new.example.com"},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["original_url"] == "https://new.example.com"


class TestDeleteURL:
    """Tests for DELETE /api/v1/urls/{short_code}."""

    async def test_soft_delete(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "del@example.com",
                "username": "deluser",
                "password": "StrongPass123!",
            },
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "del@example.com", "password": "StrongPass123!"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        # Create
        create_resp = await client.post(
            "/api/v1/urls",
            json={"original_url": "https://delete-me.example.com"},
            headers=headers,
        )
        short_code = create_resp.json()["short_code"]

        # Delete
        response = await client.delete(
            f"/api/v1/urls/{short_code}",
            headers=headers,
        )
        assert response.status_code == 204

        # Verify it's gone
        get_resp = await client.get(
            f"/api/v1/urls/{short_code}",
            headers=headers,
        )
        assert get_resp.status_code == 404
