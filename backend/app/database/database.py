from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.utils import settings

# 1. Initialize independent engines for both databases
engine_users = create_engine(settings.database_users, pool_pre_ping=True)
engine_scraper = create_engine(settings.database_scraper, pool_pre_ping=True)

# 2. Bind unique session makers to each engine
SessionUser = sessionmaker(autoflush=False, autocommit=False, bind=engine_users)
SessionScraper = sessionmaker(autoflush=False, autocommit=False, bind=engine_scraper)


def get_user_db() -> Generator[Session, None, None]:
    """FastAPI dependency for the primary/write database."""
    db = SessionUser()
    try:
        yield db
    finally:
        db.close()


def get_scraper_db() -> Generator[Session, None, None]:
    """FastAPI dependency for the secondary/read database."""
    db = SessionScraper()
    try:
        yield db
    finally:
        db.close()
