"""
Authentication-related Pydantic schemas.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """Request schema for user registration."""

    email: EmailStr
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Request schema for login."""

    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    """Response schema for JWT tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Access token expiry in seconds")


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh."""

    refresh_token: str


class UserResponse(BaseModel):
    """Response schema for user profile."""

    id: uuid.UUID
    email: str
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
