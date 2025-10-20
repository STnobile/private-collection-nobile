from app.database import SessionLocal
from app.models import User
from app.auth.hashing import get_password_hash
import getpass
from contextlib import contextmanager

@contextmanager
def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_admin_user():
    admin_email = "admin@example.com"
    admin_password = getpass.getpass("Enter admin password:")

    with get_session() as db:
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            existing_admin.password = get_password_hash(admin_password)
            db.commit()
            print("Admin password updated for:", admin_email)
            return

        new_admin = User(
            name="Admin",
            surname="User",
            email=admin_email,
            phone="0000000000",
            password=get_password_hash(admin_password),
            is_admin=True,
        )

        db.add(new_admin)
        db.commit()
        print("Admin user created with email:", admin_email)

if __name__ == "__main__":
    create_admin_user()