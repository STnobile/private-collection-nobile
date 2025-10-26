from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.auth.hashing import get_password_hash, verify_password
from app.auth.dependencies import get_current_user, get_current_admin_user

router = APIRouter()

@router.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        surname=user.surname,
        email=user.email,
        phone=user.phone,
        password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users/me", response_model=schemas.CurrentUser)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/users/{user_id:int}/bookings", response_model=List[schemas.Booking])
def get_user_bookings(user_id: int, db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).filter(models.Booking.user_id == user_id).all()
    return bookings


@router.post("/users/me/password")
def change_my_password(
    payload: schemas.PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.password = get_password_hash(payload.new_password)
    db.commit()
    return {"detail": "Password updated successfully"}

@router.put("/users/me", response_model=schemas.User)
def update_my_profile(
    update_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users/me/bookings", response_model=List[schemas.Booking])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()
    return bookings


@router.get("/users/{user_id:int}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if not current_user.is_admin and user.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user")
    return user
