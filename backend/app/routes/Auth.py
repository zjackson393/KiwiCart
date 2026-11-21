from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import User
from app.utils import settings, create_set_access_token, validate_jwt, upsert_contact
from app.schemas import JwtPayload, BreadcrumbPreference
from app.utils import validate_jwt
from app.database import get_user_db

router = APIRouter(prefix="/auth", tags=["Auth"])

oauth = OAuth()

oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    authorize_params={"scope": "openid email profile"},
    access_token_url="https://oauth2.googleapis.com/token",
    client_kwargs={"scope": "openid email profile"},
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
)


@router.get("/google")
async def google_auth(request: Request):
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")
    return await oauth.google.authorize_redirect(request, redirect_uri=settings.backend_callback)

@router.get("/guest")
async def guest_auth():
    access_token_data = JwtPayload.model_validate(
        {
            "sub": "guest",
            "email": "guest@kiwicart.app",
            "name": "Guest User"
        }
    )
    return create_set_access_token(access_token_data)

@router.get("/callback")
async def google_callback(request: Request, db: Session = Depends(get_user_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo") or {}
        if not user_info:
            # Google sometimes returns claims in id_token only.
            user_info = await oauth.google.parse_id_token(request, token) or {}

        user_id = user_info.get("sub")
        if not user_id:
            raise HTTPException(status_code=400, detail="Unable to resolve Google user id")

        db_user = db.scalar(select(User).where(User.id == user_id))
        if db_user is None:
            user_model = User(
                id=str(user_id), name=str(user_info.get("name")), email=str(user_info.get("email"))
            )

            db.add(user_model)
            db.commit()
        else:
            if not db_user.is_active:
                raise HTTPException(status_code=401, detail="User has been disabled")

        access_token_data = JwtPayload.model_validate(
            {
                "sub": user_id,
                "email": user_info.get("email"),
                "name": user_info.get("name"),
            }
        )

        return create_set_access_token(access_token_data)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OAuth login failed: {e}")


@router.delete("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "successfully logged out"}


@router.get("/me")
async def get_me(user: JwtPayload = Depends(validate_jwt)) -> JwtPayload:
    return user

@router.post("/breadcrumb/subscribe", response_model=BreadcrumbPreference)
async def subscribe_breadcrumb(
    user: JwtPayload = Depends(validate_jwt),
    db: Session = Depends(get_user_db),
):
    if user.sub == "guest":
        raise HTTPException(status_code=401, detail="Not signed in")

    db_user = db.scalar(select(User).where(User.id == user.sub))
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        upsert_contact(db_user.email, db_user.name, subscribed=True)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Resend subscribe failed: {e}")

    db_user.breadcrumb_enabled = True
    db.commit()

    return BreadcrumbPreference(enabled=True)


@router.post("/breadcrumb/unsubscribe", response_model=BreadcrumbPreference)
async def unsubscribe_breadcrumb(
    user: JwtPayload = Depends(validate_jwt),
    db: Session = Depends(get_user_db),
):
    if user.sub == "guest":
        raise HTTPException(status_code=401, detail="Not signed in")

    db_user = db.scalar(select(User).where(User.id == user.sub))
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        upsert_contact(db_user.email, db_user.name, subscribed=False)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Resend unsubscribe failed: {e}")

    db_user.breadcrumb_enabled = False
    db.commit()

    return BreadcrumbPreference(enabled=False)


@router.get("/breadcrumb-preference", response_model=BreadcrumbPreference)
async def get_breadcrumb_preference(
    user: JwtPayload = Depends(validate_jwt),
    db: Session = Depends(get_user_db),
):
    if user.sub == "guest":
        raise HTTPException(status_code=401, detail="Not signed in")

    db_user = db.scalar(select(User).where(User.id == user.sub))
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return BreadcrumbPreference(enabled=db_user.breadcrumb_enabled)