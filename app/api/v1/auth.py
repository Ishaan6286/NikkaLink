"""
Authentication API routes.

Endpoints:
  POST /api/v1/auth/register  — Register a new user
  POST /api/v1/auth/login     — Login and receive JWT tokens
  POST /api/v1/auth/refresh   — Refresh access token
  GET  /api/v1/auth/me        — Get current user profile
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, status

from app.api.deps import get_auth_service, get_current_active_user
from app.core.config import get_settings
from app.core.exceptions import AuthenticationError
from app.models.user import User
from app.schemas.auth import (
    RefreshTokenRequest,
    SSORequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email, username, and password.",
)
async def register(
    data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    user = await auth_service.register(data)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Authenticate with email and password. Returns JWT access and refresh tokens.",
)
async def login(
    data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth_service.login(data.email, data.password)


@router.post(
    "/sso",
    response_model=TokenResponse,
    summary="Trusted SSO from Next.js",
    description=(
        "Exchange a verified Google OAuth identity from the Next.js frontend "
        "for backend JWT tokens. Requires X-Frontend-SSO-Secret header."
    ),
)
async def sso_login(
    data: SSORequest,
    x_frontend_sso_secret: str = Header(..., alias="X-Frontend-SSO-Secret"),
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    settings = get_settings()
    if (
        not settings.FRONTEND_SSO_SECRET
        or x_frontend_sso_secret != settings.FRONTEND_SSO_SECRET
    ):
        raise AuthenticationError("Invalid SSO credentials")
    return await auth_service.login_or_register_sso(data.email, data.name)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access token.",
)
async def refresh(
    data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth_service.refresh_token(data.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Returns the profile of the currently authenticated user.",
)
async def me(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)
