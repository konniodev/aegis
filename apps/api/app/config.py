from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://aegis:aegis@localhost:5432/aegis"
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "changeme-generate-a-real-secret"
    cors_origins: list[str] = ["http://localhost:3000"]
    environment: str = "development"


settings = Settings()
