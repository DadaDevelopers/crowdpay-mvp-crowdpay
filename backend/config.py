import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""

    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')

    # Platform Fee Configuration (percentage, for tracking/display)
    PLATFORM_FEE_PERCENT = float(os.getenv('PLATFORM_FEE_PERCENT', '2.5'))

    # Callback URL for LNURL payment notifications
    CALLBACK_BASE_URL = os.getenv('CALLBACK_BASE_URL', 'http://localhost:5000')

    # CORS
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]

    @classmethod
    def validate(cls):
        required = [
            'SUPABASE_URL',
            'SUPABASE_KEY',
        ]

        missing = [key for key in required if not getattr(cls, key)]

        if missing:
            raise ValueError(f"Missing required configuration: {', '.join(missing)}")

        if not cls.CORS_ORIGINS:
            raise ValueError("CORS_ORIGINS is empty or misconfigured")

        return True