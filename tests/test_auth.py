"""
Tests for authentication endpoints.

Covers:
  - User registration (valid, duplicate email, duplicate username)
  - Login (valid, wrong password, nonexistent user)
  - Token refresh
  - Protected route (/auth/me)
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestRegistration:
    """Tests for POST /api/v1/auth/register."""

    async def test_register_success(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "StrongPass123!",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert data["is_active"] is True
        assert "id" in data
        # Password should not be in response
        assert "hashed_password" not in data
        assert "password" not in data

    async def test_register_duplicate_email(self, client: AsyncClient) -> None:
        # Register first user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "dupe@example.com",
                "username": "user1",
                "password": "StrongPass123!",
            },
        )
        # Try to register with same email
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "dupe@example.com",
                "username": "user2",
                "password": "StrongPass123!",
            },
        )
        assert response.status_code == 409
        assert "already exists" in response.json()["error"]["message"]

    async def test_register_duplicate_username(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "a@example.com",
                "username": "sameuser",
                "password": "StrongPass123!",
            },
        )
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "b@example.com",
                "username": "sameuser",
                "password": "StrongPass123!",
            },
        )
        assert response.status_code == 409

    async def test_register_invalid_email(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "username": "validuser",
                "password": "StrongPass123!",
            },
        )
        assert response.status_code == 422

    async def test_register_short_password(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                "username": "validuser",
                "password": "short",
            },
        )
        assert response.status_code == 422


class TestLogin:
    """Tests for POST /api/v1/auth/login."""

    async def test_login_success(self, client: AsyncClient) -> None:
        # Register first
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "login@example.com",
                "username": "loginuser",
                "password": "StrongPass123!",
            },
        )
        # Login
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "login@example.com",
                "password": "StrongPass123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    async def test_login_wrong_password(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "wp@example.com",
                "username": "wpuser",
                "password": "StrongPass123!",
            },
        )
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "wp@example.com",
                "password": "WrongPassword!",
            },
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nobody@example.com",
                "password": "SomePass123!",
            },
        )
        assert response.status_code == 401


class TestTokenRefresh:
    """Tests for POST /api/v1/auth/refresh."""

    async def test_refresh_success(self, client: AsyncClient) -> None:
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "refresh@example.com",
                "username": "refreshuser",
                "password": "StrongPass123!",
            },
        )
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "refresh@example.com",
                "password": "StrongPass123!",
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        # Refresh
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_invalid_token(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == 401


class TestProtectedRoutes:
    """Tests for GET /api/v1/auth/me."""

    async def test_me_authenticated(self, client: AsyncClient) -> None:
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "me@example.com",
                "username": "meuser",
                "password": "StrongPass123!",
            },
        )
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "me@example.com",
                "password": "StrongPass123!",
            },
        )
        token = login_resp.json()["access_token"]

        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "me@example.com"
        assert data["username"] == "meuser"

    async def test_me_unauthenticated(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code in (401, 422)

    async def test_me_invalid_token(self, client: AsyncClient) -> None:
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401
