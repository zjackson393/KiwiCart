from datetime import datetime, timezone, timedelta

import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, APIKeyCookie
from jwt import InvalidTokenError, ExpiredSignatureError
from fastapi.responses import RedirectResponse, Response

from app.utils import settings
from app.schemas import JwtPayload

cookie_scheme = APIKeyCookie(name="access_token", auto_error=True)

def _create_access_token(payload: JwtPayload) -> str:
    payload.iat = datetime.now(timezone.utc)
    return jwt.encode(payload.model_dump(), settings.jwt_secret, algorithm=settings.jwt_alg)

def create_set_access_token(payload: JwtPayload) -> RedirectResponse:
    token = _create_access_token(payload)

    if settings.env == "prod":
        redirect_url = "https://kiwicart.app"
        cookie_domain = ".kiwicart.app"
    else:
        redirect_url = "http://localhost:3000"
        cookie_domain = "localhost"
    response = RedirectResponse(url=redirect_url)

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        domain=cookie_domain,
        samesite="lax",
        max_age=settings.jwt_expire * 60,
        path="/",
    )
    return response


def validate_jwt(response: Response, token: str = Depends(cookie_scheme)) -> JwtPayload:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        return JwtPayload.model_validate(payload)
    except ExpiredSignatureError:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg],
                             options={"verify_exp": False})
        payload_parse = JwtPayload.model_validate(payload)

        if payload_parse.sub == "guest":

            guest_payload = JwtPayload.model_validate({
                "sub": "guest",
                "email": "guest@kiwicart.app",
                "name": "Guest User"
            })

            # Generate a new one
            token = _create_access_token(guest_payload)

            if settings.env == "prod":
                cookie_domain = ".kiwicart.app"
            else:
                cookie_domain = "localhost"

            response.set_cookie(
                key="access_token",
                value=token,
                httponly=True,
                secure=True,
                domain=cookie_domain,
                samesite="lax",
                max_age=settings.jwt_expire * 60,
                path="/",
            )
            return guest_payload
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired JWT"
            )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate JWT credentials"
        )