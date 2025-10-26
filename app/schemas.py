from __future__ import annotations

from typing import List, Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
import json

# ----------------- Auth -----------------


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


# ----------------- User -----------------


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class AdminPasswordResetRequest(BaseModel):
    new_password: str

class UserCreate(BaseModel):
    name: str
    surname: str
    email: str
    phone: str
    password: str

class User(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True
        
class UserAdmin(BaseModel):
    id: int
    name: str
    surname: str
    email: str
    phone: str
    is_admin: bool

    class Config:
        from_attributes = True
        
class BookingSummary(BaseModel):
    id: int
    date_time: datetime
    people: int
    info_message: str | None = None

    class Config:
        from_attributes = True       
        
class UserOverview(BaseModel):
    id: int
    name: str
    surname: str
    email: str
    phone: str
    is_admin: bool
    bookings: List[BookingSummary] = []

    class Config:
        from_attributes = True
        
class UserUpdate(BaseModel):
    name: str | None = None
    surname: str | None = None
    email: str | None = None
    phone: str | None = None
    is_admin: bool | None = None             

class CurrentUser(BaseModel):
    id: int
    name: str
    surname: str
    email: str
    phone: str
    is_admin: bool

    class Config:
        from_attributes = True

class DeletedUser(BaseModel):
    id: int
    user_id: int
    name: str
    surname: str
    email: str
    phone: str
    is_admin: bool
    deleted_at: datetime

    class Config:
        from_attributes = True
# ----------------- Booking -----------------

class BookingCreate(BaseModel):
    date_time: datetime
    people: int = Field(..., gt=0)
    info_message: str | None = None
    experience_type: Literal["guided_tour", "tour_tasting"]
    guest_contacts: List["GuestContact"] | None = None
    
    @field_validator("date_time")
    @classmethod
    def date_must_be_in_future(cls, value):
        now = datetime.now(tz=value.tzinfo)
        if value <= now:
          raise ValueError("Booking time must be in the future")
        return value

    @model_validator(mode="after")
    def validate_operating_hours(cls, values):
        date_time = values.date_time
        if date_time is None:
            return values

        allowed_slots = {
            (9, 0),
            (10, 30),
            (12, 0),
            (15, 0),
            (16, 30),
            (18, 0),
        }
        hour_minute = (date_time.hour, date_time.minute)
        if hour_minute not in allowed_slots:
            raise ValueError("Choose one of the available slots: 09:00, 10:30, 12:00, 15:00, 16:30, 18:00")
        return values

class Booking(BaseModel):
    id: int
    date_time: datetime
    people: int
    info_message: str | None = None
    user_id: int
    created_at: datetime
    experience_type: Literal["guided_tour", "tour_tasting"]
    guest_contacts: List["GuestContact"] | None = None

    class Config:
        from_attributes = True

    @field_validator("guest_contacts", mode="before")
    @classmethod
    def parse_guest_contacts(cls, value):
        if value is None or value == "":
            return None
        if isinstance(value, list):
            return value
        try:
            return json.loads(value)
        except Exception:
            return None
        
class BookingUpdate(BaseModel):
    date_time: datetime | None = None
    people: int | None = None
    info_message: str | None = None
    experience_type: Literal["guided_tour", "tour_tasting"] | None = None
    guest_contacts: List["GuestContact"] | None = None

    class Config:
        from_attributes = True


class GuestContact(BaseModel):
    name: str
    email: str


class BookingUpdateRequestBase(BaseModel):
    requested_date_time: datetime | None = None
    requested_people: int | None = Field(None, gt=0)
    requested_info_message: str | None = None
    note: str | None = None

    @field_validator("requested_date_time")
    @classmethod
    def requested_date_must_be_future(cls, value):
        if value is None:
            return value
        now = datetime.now(tz=value.tzinfo)
        if value <= now:
            raise ValueError("Requested booking time must be in the future")
        return value


class BookingUpdateRequestCreate(BookingUpdateRequestBase):
    @model_validator(mode="after")
    def ensure_any_change(cls, values):
        if not any([
            values.requested_date_time,
            values.requested_people,
            values.requested_info_message,
        ]):
            raise ValueError("Provide at least one field to update")
        return values


class BookingUpdateRequest(BookingUpdateRequestBase):
    id: int
    booking_id: int
    user_id: int
    status: str
    admin_note: str | None = None
    created_at: datetime
    updated_at: datetime
    processed_at: datetime | None = None

    class Config:
        from_attributes = True


class BookingUpdateDecision(BaseModel):
    status: str
    admin_note: str | None = None

    @field_validator("status")
    @classmethod
    def allowed_status(cls, value):
        allowed = {"approved", "rejected"}
        if value not in allowed:
            raise ValueError(f"Status must be one of {', '.join(sorted(allowed))}")
        return value
           
class DeletedBooking(BaseModel):
    id: int
    booking_id: int
    date_time: datetime
    people: int
    info_message: str | None
    user_id: int
    user_name: str
    user_surname: str
    user_email: str
    user_phone: str
    deleted_at: datetime

    class Config:
        from_attributes = True        
