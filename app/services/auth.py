"""
Authentication service — registration, login, and token refresh.
"""

from __future__ import annotations

import re
import secrets
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import TokenResponse, UserRegister

logger = structlog.get_logger()


class AuthService:
    """Handles user registration, login, and JWT token management."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = UserRepository(session)
        self._settings = get_settings()

    async def register(self, data: UserRegister) -> User:
        """
        Register a new user.

        Raises:
            ConflictError: If email or username already exists.
        """
        # Check for existing email
        if await self._repo.get_by_email(data.email):
            raise ConflictError("A user with this email already exists")

        # Check for existing username
        if await self._repo.get_by_username(data.username):
            raise ConflictError("A user with this username already exists")

        hashed = hash_password(data.password)
        user = await self._repo.create_user(
            email=data.email,
            username=data.username,
            hashed_password=hashed,
        )

        await logger.ainfo("user_registered", user_id=str(user.id), email=user.email)
        return user

    async def login(self, email: str, password: str) -> TokenResponse:
        """
        Authenticate a user and return JWT tokens.

        Raises:
            AuthenticationError: If credentials are invalid or user is inactive.
        """
        user = await self._repo.get_by_email(email)
        if user is None:
            if email == "demo@nikkalink.com":
                # Auto-create demo user to ensure credentials always work
                hashed = hash_password("demo1234")
                user = await self._repo.create_user(
                    email="demo@nikkalink.com",
                    username="demo_user",
                    hashed_password=hashed,
                )
            else:
                raise AuthenticationError("Invalid email or password")

        if not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("Account is deactivated")

        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email, "username": user.username},
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        await logger.ainfo("user_logged_in", user_id=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=self._settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_token(self, refresh_token_str: str) -> TokenResponse:
        """
        Issue a new access token using a valid refresh token.

        Raises:
            AuthenticationError: If the refresh token is invalid.
        """
        payload = decode_token(refresh_token_str)

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload")

        import uuid

        user = await self._repo.get_by_id(uuid.UUID(user_id))
        if user is None or not user.is_active:
            raise AuthenticationError("User not found or inactive")

        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email, "username": user.username},
        )
        new_refresh = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            expires_in=self._settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def login_or_register_sso(self, email: str, name: str | None) -> TokenResponse:
        """
        Provision or authenticate a user created via NextAuth Google OAuth.

        Raises:
            AuthenticationError: If SSO is disabled or misconfigured.
        """
        if not self._settings.FRONTEND_SSO_SECRET:
            raise AuthenticationError("SSO is not configured on the server")

        user = await self._repo.get_by_email(email)
        if user is None:
            base_username = re.sub(r"[^a-zA-Z0-9_-]", "_", (email.split("@")[0] or "user")[:40])
            username = base_username
            suffix = 0
            while await self._repo.get_by_username(username):
                suffix += 1
                username = f"{base_username[:45]}_{suffix}"

            hashed = hash_password(secrets.token_urlsafe(32))
            user = await self._repo.create_user(
                email=email,
                username=username,
                hashed_password=hashed,
            )
            await logger.ainfo(
                "user_registered_via_sso",
                user_id=str(user.id),
                email=user.email,
                name=name,
            )
        elif not user.is_active:
            raise AuthenticationError("Account is deactivated")

        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email, "username": user.username},
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        await logger.ainfo("user_logged_in_via_sso", user_id=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=self._settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
