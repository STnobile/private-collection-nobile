import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.database import get_db
from app.auth.dependencies import get_current_admin_user, admin_required
from app.auth.hashing import get_password_hash
from typing import List

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

@router.get("/dashboard")
def get_admin_dashboard(current_user=Depends(admin_required)):
    return {"message": f"Welcome, {current_user.name}. You're an admin."}

@router.get("/users", response_model=List[schemas.UserAdmin])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    return db.query(models.User).all()

@router.get("/overview", response_model=List[schemas.UserOverview])
def get_admin_user_overview(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    users = db.query(models.User).all()
    user_overviews = []
    for user in users:
        bookings = db.query(models.Booking).filter(models.Booking.user_id == user.id).all()
        booking_summaries = [
            schemas.BookingSummary(
                id=b.id,
                date_time=b.date_time,
                people=b.people,
                info_message=b.info_message
            ) for b in bookings
        ]
        user_overviews.append(
            schemas.UserOverview(
                id=user.id,
                name=user.name,
                surname=user.surname,
                email=user.email,
                phone=user.phone,
                is_admin=user.is_admin,
                bookings=booking_summaries
            )
        )
    return user_overviews

@router.get("/bookings", response_model=List[schemas.Booking])
def get_all_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required)
):
    return db.query(models.Booking).all()

@router.get("/deleted-users", response_model=List[schemas.DeletedUser])
def get_deleted_users(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    return db.query(models.DeletedUser).all()

@router.get("/deleted-bookings", response_model=List[schemas.DeletedBooking])
def get_deleted_bookings(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    return db.query(models.DeletedBooking).all()

@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deleted_user = models.DeletedUser(
        user_id=user.id,
        name=user.name,
        surname=user.surname,
        email=user.email,
        phone=user.phone,
        deleted_at=datetime.datetime.utcnow()
    )

    db.add(deleted_user)
    db.delete(user)
    db.commit()
    return {"detail": f"User {user_id} deleted."}

@router.delete("/bookings/{booking_id}")
def delete_booking_as_admin(
    booking_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    deleted_booking = models.DeletedBooking(
        booking_id=booking.id,
        date_time=booking.date_time,
        people=booking.people,
        info_message=booking.info_message,
        user_id=booking.user.id,
        user_name=booking.user.name,
        user_surname=booking.user.surname,
        user_email=booking.user.email,
        user_phone=booking.user.phone,
        deleted_at=datetime.datetime.utcnow()
    )

    db.add(deleted_booking)
    db.delete(booking)
    db.commit()
    return {"detail": f"Booking {booking_id} deleted by admin."}

@router.put("/users/{user_id}", response_model=schemas.UserAdmin)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/password")
def reset_user_password(
    user_id: int,
    request: schemas.AdminPasswordResetRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = get_password_hash(request.new_password)
    db.commit()
    return {"detail": f"Password reset for user {user_id}"}

@router.put("/bookings/{booking_id}", response_model=schemas.Booking)
def update_any_booking(
    booking_id: int,
    booking_update: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    for key, value in booking_update.dict(exclude_unset=True).items():
        setattr(booking, key, value)

    db.commit()
    db.refresh(booking)
    return booking

@router.get("/stats")
def get_admin_statistics(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    total_users = db.query(models.User).count()
    total_admins = db.query(models.User).filter(models.User.is_admin == True).count()
    total_bookings = db.query(models.Booking).count()
    deleted_users = db.query(models.DeletedUser).count()
    deleted_bookings = db.query(models.DeletedBooking).count()

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_regular_users": total_users - total_admins,
        "active_bookings": total_bookings,
        "deleted_users": deleted_users,
        "deleted_bookings": deleted_bookings
    }

@router.get("/trends")
def get_trends(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    today = datetime.date.today()
    one_week_ago = today - datetime.timedelta(days=7)
    one_month_ago = today - datetime.timedelta(days=30)
    week_start = datetime.datetime.combine(one_week_ago, datetime.datetime.min.time())
    month_start = datetime.datetime.combine(one_month_ago, datetime.datetime.min.time())

    weekly_user_signups = db.query(
        func.strftime('%Y-%m-%d', models.User.created_at).label('date'),
        func.count(models.User.id)
    ).filter(
        models.User.created_at >= week_start
    ).group_by('date').all()

    monthly_user_signups = db.query(
        func.strftime('%Y-%m', models.User.created_at).label('month'),
        func.count(models.User.id)
    ).filter(
        models.User.created_at >= month_start
    ).group_by('month').all()

    weekly_bookings = db.query(
        func.strftime('%Y-%m-%d', models.Booking.date_time).label('date'),
        func.count(models.Booking.id)
    ).filter(
        models.Booking.date_time >= week_start
    ).group_by('date').all()

    monthly_bookings = db.query(
        func.strftime('%Y-%m', models.Booking.date_time).label('month'),
        func.count(models.Booking.id)
    ).filter(
        models.Booking.date_time >= month_start
    ).group_by('month').all()

    return {
        "weekly_user_signups": [
            {"date": row[0], "count": row[1]} for row in weekly_user_signups
        ],
        "monthly_user_signups": [
            {"month": row[0], "count": row[1]} for row in monthly_user_signups
        ],
        "weekly_bookings": [
            {"date": row[0], "count": row[1]} for row in weekly_bookings
        ],
        "monthly_bookings": [
            {"month": row[0], "count": row[1]} for row in monthly_bookings
        ],
    }
