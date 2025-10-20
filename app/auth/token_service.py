import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app import models

REFRESH_TOKEN_EXPIRE_DAYS = 7


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def issue_refresh_token(db: Session, user_id: int) -> tuple[str, datetime]:
    """
    Generate a new refresh token for the given user, revoking any existing active ones.
    Returns the raw token (to send to the client) and its expiry timestamp.
    """
    # Revoke existing active tokens for this user
    db.query(models.RefreshToken).filter(
        models.RefreshToken.user_id == user_id,
        models.RefreshToken.revoked.is_(False),
        models.RefreshToken.expires_at > datetime.utcnow(),
    ).update({models.RefreshToken.revoked: True}, synchronize_session=False)

    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    token_hash = _hash_token(raw_token)

    refresh = models.RefreshToken(
        token_hash=token_hash,
        user_id=user_id,
        expires_at=expires_at,
    )
    db.add(refresh)
    db.flush()
    return raw_token, expires_at


def rotate_refresh_token(db: Session, refresh_obj: models.RefreshToken) -> tuple[str, datetime]:
    """
    Revoke the provided refresh token and issue a new one for the same user.
    """
    refresh_obj.revoked = True
    return issue_refresh_token(db, refresh_obj.user_id)


def get_valid_refresh_token(db: Session, token: str) -> models.RefreshToken | None:
    token_hash = _hash_token(token)
    refresh = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == token_hash,
        models.RefreshToken.revoked.is_(False),
    ).first()

    if not refresh or refresh.expires_at <= datetime.utcnow():
        return None
    return refresh
