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

    # LNbits Configuration
    # LNbits is an open-source Lightning wallet/accounts system
    # Demo server: https://demo.lnbits.com (for testing only)
    LNBITS_URL = os.getenv('LNBITS_URL', 'https://demo.lnbits.com')
    LNBITS_WALLET_ID = os.getenv('LNBITS_WALLET_ID')
    LNBITS_ADMIN_KEY = os.getenv('LNBITS_ADMIN_KEY')  # Full access - keep secure!
    LNBITS_INVOICE_KEY = os.getenv('LNBITS_INVOICE_KEY')  # Read-only, safe for invoices
    LNBITS_WEBHOOK_URL = os.getenv('LNBITS_WEBHOOK_URL', '')  # Optional webhook for payment notifications
    
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')

    # Polling Configuration
    POLLING_INTERVAL = int(os.getenv('POLLING_INTERVAL', '30'))  # seconds
    POLLING_TIMEOUT = int(os.getenv('POLLING_TIMEOUT', '3600'))  # 1 hour

    # Platform Fee Configuration (percentage)
    PLATFORM_FEE_PERCENT = float(os.getenv('PLATFORM_FEE_PERCENT', '2.5'))
    
    # CORS
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]

    @classmethod
    def validate(cls):
        required = [
            "SUPABASE_URL",
            "SUPABASE_KEY",
            "LNBITS_URL",
            "LNBITS_INVOICE_KEY",
        ]

        missing = [key for key in required if not getattr(cls, key)]

        if missing:
            raise ValueError(f"Missing required configuration: {', '.join(missing)}")

        if not cls.CORS_ORIGINS:
            raise ValueError("CORS_ORIGINS is empty or misconfigured")

        return True