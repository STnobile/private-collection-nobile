from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from app.routes import auth_routes
from app.routes import admin_routes 
from app.routes import user_routes
from app.auth.dependencies import get_current_user
from app import models


models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(user_routes.router)
# CORS (optional)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def log_deleted_booking(db, booking):
    deleted = models.DeletedBooking(
        booking_id=booking.id,
        date_time=booking.date_time,
        people=booking.people,
        info_message=booking.info_message,
        user_id=booking.user.id,
        user_name=booking.user.name,
        user_surname=booking.user.surname,
        user_email=booking.user.email,
        user_phone=booking.user.phone
    )
    db.add(deleted)
    db.commit()


@app.post("/bookings/", response_model=schemas.Booking)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    db_booking = models.Booking(**booking.dict())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

@app.get("/bookings/{booking_id}", response_model=schemas.Booking)
def read_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if not current_user.is_admin and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this booking")

    return booking


@app.put("/bookings/{booking_id}", response_model=schemas.Booking)
def update_booking(
    booking_id: int,
    booking: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if not current_user.is_admin and db_booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")

    for field, value in booking.dict(exclude_unset=True).items():
        setattr(db_booking, field, value)

    db.commit()
    db.refresh(db_booking)
    return db_booking

@app.delete("/bookings/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if not current_user.is_admin and db_booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this booking")

    log_deleted_booking(db, db_booking)
    db.delete(db_booking)
    db.commit()
    return {"message": "Booking deleted successfully"}

@app.get("/deleted-bookings/", response_model=List[schemas.DeletedBooking])
def get_deleted_bookings(db: Session = Depends(get_db)):
    return db.query(models.DeletedBooking).all()
