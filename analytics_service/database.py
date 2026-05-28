import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
load_dotenv()

# ── Neon PostgreSQL Connection ─────────────────────────────────────────────────
# Set the DATABASE_URL environment variable to your Neon connection string, e.g.:
# export DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/dbname?sslmode=require"

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Add your Neon connection string before starting the server."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # Neon pauses idle connections — this keeps them alive
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency injector — yields a DB session per request and closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()