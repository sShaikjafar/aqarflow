from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.agency import Agency
from app.models.user import User


def main():
    db = SessionLocal()
    try:
        agency = db.scalar(select(Agency).where(Agency.slug == "demo-realty"))
        if not agency:
            agency = Agency(name="Demo Realty", slug="demo-realty")
            db.add(agency)
            db.flush()

        users = [
            ("Demo Admin", "admin@demo.com", "admin"),
            ("Demo Agent", "agent@demo.com", "agent"),
        ]
        for full_name, email, role in users:
            exists = db.scalar(select(User).where(User.email == email))
            if not exists:
                db.add(
                    User(
                        agency_id=agency.id,
                        full_name=full_name,
                        email=email,
                        password_hash=hash_password("Demo@12345"),
                        role=role,
                    )
                )
        db.commit()
        print("Seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    main()
