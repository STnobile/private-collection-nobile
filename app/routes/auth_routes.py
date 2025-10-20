from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from .. import models, database, schemas
from ..auth.hashing import verify_password
from ..auth.jwt_handler import create_access_token
from app.database import get_db
from app.auth.token_service import (
    issue_refresh_token,
    get_valid_refresh_token,
    rotate_refresh_token,
)

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password):
        return None
    return user

router = APIRouter()

@router.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    access_token = create_access_token(data={"sub": user.email})
    refresh_token, _ = issue_refresh_token(db, user.id)
    db.commit()
    return schemas.Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/token/refresh", response_model=schemas.Token)
def refresh_access_token(payload: schemas.TokenRefreshRequest, db: Session = Depends(get_db)):
    stored_refresh = get_valid_refresh_token(db, payload.refresh_token)
    if not stored_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = stored_refresh.user
    access_token = create_access_token(data={"sub": user.email})
    new_refresh_token, _ = rotate_refresh_token(db, stored_refresh)
    db.commit()
    return schemas.Token(access_token=access_token, refresh_token=new_refresh_token)
