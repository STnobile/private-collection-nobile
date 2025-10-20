from typing import List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

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
    
    user_id: int
    
    @field_validator("date_time")
    @classmethod
    def date_must_be_in_future(cls, value):
        now = datetime.now(tz=value.tzinfo)
        if value <= now:
          raise ValueError("Booking time must be in the future")
        return value

class Booking(BaseModel):
    id: int
    date_time: datetime
    people: int
    info_message: str
    user_id: int

    class Config:
        from_attributes = True
        
class BookingUpdate(BaseModel):
    date_time: datetime | None = None
    people: int | None = None
    info_message: str | None = None

    class Config:
        from_attributes = True
           
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
