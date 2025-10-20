from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    SECRET_KEY: str = "change-me"  # override in environment for production


settings = Settings()
