from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RegisterRequest(RequestModel):
    name: str = Field(min_length=2, max_length=50)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(RequestModel):
    login: str | None = Field(default=None, min_length=1, max_length=254)
    email: str | None = Field(default=None, min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @model_validator(mode="after")
    def require_login_or_email(self) -> "LoginRequest":
        if not self.login and not self.email:
            raise ValueError("login or email is required")
        return self


class ChangePasswordRequest(RequestModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UpdateProfileRequest(RequestModel):
    name: str = Field(min_length=2, max_length=50)


WatchlistStatus = Literal["watching", "plan_to_watch", "completed", "on_hold", "dropped"]


class WatchlistToggleRequest(RequestModel):
    anime_id: int = Field(gt=0)
    status: WatchlistStatus


class ProgressRequest(RequestModel):
    anime_id: int = Field(gt=0)
    episode_number: int = Field(gt=0)
    watched: bool


class SettingsRequest(RequestModel):
    default_player: Literal["auto", "kodik"] | None = None
    default_quality: Literal["auto", "360p", "480p", "720p", "1080p"] | None = None
    default_dubbing: str | None = Field(default=None, min_length=1, max_length=80)
    notifications_enabled: bool | None = None
    cache_size_limit: int | None = Field(default=None, ge=64, le=4096)


class CommentRequest(RequestModel):
    text: str = Field(min_length=1, max_length=2000)
    parent_id: int | None = Field(default=None, gt=0)

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("comment is empty")
        return stripped


class VoteRequest(RequestModel):
    value: Literal[1, -1, 0]


class AdminPasswordResetRequest(RequestModel):
    password: str = Field(min_length=8, max_length=128)


class AdminRoleRequest(RequestModel):
    role: Literal["user", "admin"]


class AdminBlockedRequest(RequestModel):
    is_blocked: bool


class StaticPageUpdateRequest(RequestModel):
    title: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1, max_length=20000)

    @field_validator("title", "content")
    @classmethod
    def strip_non_empty(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("value is empty")
        return stripped
