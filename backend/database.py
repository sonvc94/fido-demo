from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import bcrypt

DATABASE_URL = "sqlite:///./fido.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    credential_id = Column(String, nullable=True)
    public_key = Column(String, nullable=True)
    sign_count = Column(Integer, default=0)
    aaguid = Column(String, nullable=True)


def init_db():
    """Initialize database and create default user"""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Check if default user exists
    existing_user = db.query(User).filter(User.username == "user").first()
    if not existing_user:
        # Create default user with password "user"
        password_hash = bcrypt.hashpw("user".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        default_user = User(
            username="user",
            password_hash=password_hash,
            display_name="Default User"
        )
        db.add(default_user)
        db.commit()
        print("Default user created: user/user")
    else:
        print("Default user already exists")

    db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
