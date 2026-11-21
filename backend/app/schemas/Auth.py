from datetime import datetime, timezone, timedelta
from typing import Optional

from pydantic import Field
from pydantic import BaseModel

from app.utils import settings


class JwtPayload(BaseModel):
    sub: str
    email: str
    name: str
    exp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire)
    )
    iat: Optional[datetime] = None

class BreadcrumbPreference(BaseModel):
    enabled: bool