from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    bookings = relationship("Booking", back_populates="user")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(DateTime, nullable=False)
    people = Column(Integer, nullable=False)
    info_message = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="bookings")
 
    
class DeletedBooking(Base):
    __tablename__ = "deleted_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, index=True, nullable=False)
    date_time = Column(DateTime)
    people = Column(Integer)
    info_message = Column(String)
    user_id = Column(Integer, index=True, nullable=False)
    user_name = Column(String, nullable=False)
    user_surname = Column(String, nullable=False)
    user_email = Column(String, nullable=False)
    user_phone = Column(String, nullable=False)
    deleted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class DeletedUser(Base):
    __tablename__ = "deleted_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String)
    surname = Column(String)
    email = Column(String)
    phone = Column(String)
    is_admin = Column(Boolean, default=False)
    deleted_at = Column(DateTime, default=datetime.utcnow)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_hash = Column(String, unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)

    user = relationship("User")
