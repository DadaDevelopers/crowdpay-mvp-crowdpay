"""
CLI command to manually trigger invoice expiry check

Usage:
    python -m commands.expire_invoices
"""

import sys
import logging
from services.invoice_expiry_service import InvoiceExpiryService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

if __name__ == '__main__':
    print("🔍 Running invoice expiry check...")
    
    service = InvoiceExpiryService()
    expired_count = service.run_once()
    
    print(f"✅ Done! Expired {expired_count} invoices")
    sys.exit(0)