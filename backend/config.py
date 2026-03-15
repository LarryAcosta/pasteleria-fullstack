from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.app_name = os.getenv("APP_NAME", "Pasteleria API")
        self.app_env = os.getenv("APP_ENV", "production")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./pasteleria.db")


@lru_cache
def get_settings():
    return Settings()
