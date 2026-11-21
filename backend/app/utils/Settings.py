from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralised application configuration.

    All secrets and environment-dependent values are read from the
    environment (or a local .env file) — nothing sensitive is ever
    hard-coded in source. See backend/.env.sample for the full list
    of variables a deployment needs to set.
    """

    google_client_id: str
    google_client_secret: str
    jwt_secret: str
    jwt_alg: str = "HS256"
    jwt_expire: int = 60
    backend_callback: str = "http://localhost:8000/auth/callback"
    session_key: str
    frontend_origin: str = "http://localhost:3000"
    database_users: str
    database_scraper: str
    env: str = "dev"
    s3_bucket: str
    s3_access_key_id: str
    s3_secret_access_key: str
    aws_region: str
    aws_endpoint: str
    resend_api_key: str
    resend_audience_id: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
