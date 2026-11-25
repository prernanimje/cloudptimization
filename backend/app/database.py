"""Database connection and session management"""
import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' package is always resolvable
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

try:
    from app.config import DATABASE_URL  # noqa: E402
    from app.models import Base  # noqa: E402
except ImportError:
    from .config import DATABASE_URL  # type: ignore  # noqa: E402
    from .models import Base  # type: ignore  # noqa: E402

# Clean and normalize database URL
db_url = DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Create database engine
engine_kwargs = {}
if "sqlite" in db_url:
    engine_kwargs["poolclass"] = StaticPool
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL connection pool settings
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    db_url,
    echo=False,
    **engine_kwargs
)

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Create all tables
def init_db():
    """Initialize database and create all tables"""
    Base.metadata.create_all(bind=engine)


# Dependency for FastAPI
def get_db():
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database tables...")
    init_db()
    print("Database tables initialized successfully!")
