from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from zoneinfo import ZoneInfo
import json
from app.routes import auth_routes
from app.routes import admin_routes 
from app.routes import user_routes
from app.auth.dependencies import get_current_user


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

OPERATING_START_HOUR = 9
OPERATING_START_MINUTE = 0
OPERATING_END_HOUR = 19
OPERATING_END_MINUTE = 30
MUSEUM_TZ = ZoneInfo("Europe/Rome")


def normalize_slot(dt: datetime) -> datetime:
    return dt.replace(second=0, microsecond=0)


def to_local_naive(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(MUSEUM_TZ).replace(tzinfo=None)


def ensure_within_operating_hours(dt: datetime):
    dt_time = dt.time()
    if dt_time.hour < OPERATING_START_HOUR or (
        dt_time.hour == OPERATING_START_HOUR and dt_time.minute < OPERATING_START_MINUTE
    ):
        raise HTTPException(status_code=400, detail="Bookings start at 09:00")
    if dt_time.hour > OPERATING_END_HOUR or (
        dt_time.hour == OPERATING_END_HOUR and dt_time.minute > OPERATING_END_MINUTE
    ):
        raise HTTPException(status_code=400, detail="Last booking slot finishes at 19:30")
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
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    local_dt = to_local_naive(booking.date_time)
    booking_datetime = normalize_slot(local_dt)
    ensure_within_operating_hours(booking_datetime)
    booking_data = booking.dict()
    booking_data["date_time"] = booking_datetime
    guest_contacts = booking_data.pop("guest_contacts", None)
    if guest_contacts:
        booking_data["guest_contacts"] = json.dumps([contact for contact in guest_contacts])
    db_booking = models.Booking(**booking_data, user_id=current_user.id)
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def parse_iso_datetime(value: str) -> datetime:
    try:
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format") from exc


# Availability endpoint placed before dynamic /bookings/{booking_id} route
@app.get("/bookings/availability")
def get_booking_availability(
    date_time: str,
    experience_type: str = "guided_tour",
    db: Session = Depends(get_db),
):
    if experience_type not in {"guided_tour", "tour_tasting"}:
        raise HTTPException(status_code=400, detail="Invalid experience type")

    parsed_date = parse_iso_datetime(date_time)
    local_dt = to_local_naive(parsed_date)
    normalized = normalize_slot(local_dt)
    ensure_within_operating_hours(normalized)

    capacity = 20 if experience_type == "guided_tour" else 12
    booked = (
        db.query(models.Booking)
        .filter(
            models.Booking.date_time == normalized,
            models.Booking.experience_type == experience_type,
        )
        .count()
    )

    return {
        "date_time": normalized,
        "experience_type": experience_type,
        "capacity": capacity,
        "booked": booked,
        "remaining": max(capacity - booked, 0),
        "is_full": booked >= capacity,
    }


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
        if field == "date_time" and value is not None:
            value = normalize_slot(to_local_naive(value))
            ensure_within_operating_hours(value)
        if field == "guest_contacts":
            value = json.dumps(value) if value else None
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


@app.post("/bookings/{booking_id}/update-request", response_model=schemas.BookingUpdateRequest)
def request_booking_update(
    booking_id: int,
    request_payload: schemas.BookingUpdateRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if not current_user.is_admin and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")

    pending_request = (
        db.query(models.BookingUpdateRequest)
        .filter(
            models.BookingUpdateRequest.booking_id == booking_id,
            models.BookingUpdateRequest.status == "pending",
        )
        .first()
    )

    if pending_request and not current_user.is_admin:
        raise HTTPException(status_code=400, detail="A pending update request already exists")

    new_request = models.BookingUpdateRequest(
        booking_id=booking_id,
        user_id=current_user.id,
        requested_date_time=request_payload.requested_date_time,
        requested_people=request_payload.requested_people,
        requested_info_message=request_payload.requested_info_message,
        note=request_payload.note,
        status="approved" if current_user.is_admin else "pending",
        processed_at=datetime.utcnow() if current_user.is_admin else None,
    )

    if current_user.is_admin and new_request.status == "approved":
        if new_request.requested_date_time:
            booking.date_time = new_request.requested_date_time
        if new_request.requested_people:
            booking.people = new_request.requested_people
        if new_request.requested_info_message is not None:
            booking.info_message = new_request.requested_info_message

    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@app.get("/bookings/update-requests/me", response_model=List[schemas.BookingUpdateRequest])
def list_my_booking_update_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.BookingUpdateRequest)
        .filter(models.BookingUpdateRequest.user_id == current_user.id)
        .order_by(models.BookingUpdateRequest.created_at.desc())
        .all()
    )
