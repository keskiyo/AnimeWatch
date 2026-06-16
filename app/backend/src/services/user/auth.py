"""Auth business logic: register, login, sessions, password change, admin seed."""

import re

from src.config import get_settings
from src.db.admin.users import is_user_blocked, touch_user_last_seen
from src.db.user.users import (
    create_session,
    create_user,
    delete_session,
    email_exists,
    ensure_users_schema,
    find_user_by_login,
    get_user_by_token,
    set_user_name,
    set_user_password,
    verify_password,
)
from src.logger import get_logger

log = get_logger(__name__)

_NAME_RE = re.compile(r"^[A-Za-zА-Яа-яЁё' -]+$")
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class AuthError(Exception):
    """code: invalid_credentials | email_taken | validation | unauthorized"""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def _db() -> str:
    return get_settings().database_path


def validate_registration(name: str, email: str, password: str) -> None:
    """Server-side validation — the client checks are NOT the real protection."""
    if not name or len(name) < 2 or len(name) > 50 or not _NAME_RE.match(name):
        raise AuthError("validation", "Некорректное имя")
    if not email or not _EMAIL_RE.match(email):
        raise AuthError("validation", "Некорректный email")
    if not password or not password.strip() or len(password) < 8 or len(password) > 128:
        raise AuthError("validation", "Пароль должен быть от 8 до 128 символов")


def register_user(name: str, email: str, password: str) -> dict:
    name, email = name.strip(), email.strip()
    validate_registration(name, email, password)
    db = _db()
    if email_exists(db, email) or find_user_by_login(db, name):
        raise AuthError("email_taken", "Пользователь уже зарегистрирован")
    user = create_user(db, name, email, password)
    token = create_session(db, user["id"])
    log.info("auth: registered user id=%s", user["id"])
    return {"token": token, "user": user}


def login_user(login: str, password: str) -> dict:
    db = _db()
    user = find_user_by_login(db, login.strip())
    if not user or not verify_password(password, user.pop("password_hash", "")):
        raise AuthError("invalid_credentials", "Неверный логин или пароль")
    if is_user_blocked(db, int(user["id"])):
        raise AuthError("blocked", "Аккаунт заблокирован")
    token = create_session(db, user["id"])
    return {"token": token, "user": user}


def get_current_user(token: str | None) -> dict:
    if not token:
        raise AuthError("unauthorized", "Требуется авторизация")
    db = _db()
    user = get_user_by_token(db, token)
    if not user:
        raise AuthError("unauthorized", "Сессия истекла")
    if is_user_blocked(db, int(user["id"])):
        raise AuthError("blocked", "Аккаунт заблокирован")
    touch_user_last_seen(db, int(user["id"]))
    return user


def logout_user(token: str | None) -> None:
    if token:
        delete_session(_db(), token)


def change_password(token: str | None, old_password: str, new_password: str) -> None:
    user = get_current_user(token)
    db = _db()
    with_hash = find_user_by_login(db, user["email"]) or {}
    if not verify_password(old_password, with_hash.get("password_hash", "")):
        raise AuthError("invalid_credentials", "Текущий пароль неверен")
    if len(new_password) < 8 or len(new_password) > 128 or not new_password.strip():
        raise AuthError("validation", "Новый пароль должен быть от 8 до 128 символов")
    set_user_password(db, user["id"], new_password)
    log.info("auth: password changed for user id=%s", user["id"])


def update_profile(token: str | None, name: str) -> dict:
    user = get_current_user(token)
    name = name.strip()
    if not name or len(name) < 2 or len(name) > 50 or not _NAME_RE.match(name):
        raise AuthError("validation", "Некорректное имя")
    existing = find_user_by_login(_db(), name)
    if existing and existing["id"] != user["id"]:
        raise AuthError("email_taken", "Пользователь уже зарегистрирован")
    updated = set_user_name(_db(), user["id"], name)
    if not updated:
        raise AuthError("unauthorized", "Сессия истекла")
    return updated


def seed_admin_user() -> None:
    """Create the default admin (login: admin / password: admin) once.

    Change the password right after the first login — via the profile page
    or: python -c "from src.services.user.auth import reset_password_cli; reset_password_cli('admin', 'NEW')"
    """
    db = _db()
    ensure_users_schema(db)
    if find_user_by_login(db, "admin"):
        return
    create_user(db, "admin", "admin@animewatch.local", "admin", role="admin")
    log.warning("auth: default admin created (admin/admin) — CHANGE THE PASSWORD")


def reset_password_cli(login: str, new_password: str) -> None:
    """Manual password reset from the terminal (e.g. forgotten admin password)."""
    db = _db()
    ensure_users_schema(db)
    user = find_user_by_login(db, login)
    if not user:
        print(f"user {login!r} not found")
        return
    set_user_password(db, user["id"], new_password)
    print(f"password updated for {login!r}")
