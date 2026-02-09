"""
Invoice Expiry Service - Background job to mark expired Lightning invoices

This service runs periodically to find pending contributions with expired invoices
and marks them as expired. It also stops polling for those contributions.

Running modes:
1. As a scheduled task (cron job)
2. As a background thread in the Flask app
3. Manually via CLI command
"""

import logging
from datetime import datetime
from typing import List, Dict
import time
from threading import Thread, Event

from services import get_supabase_client, LNbitsService
from services.lnbits import LNbitsAPIError

logger = logging.getLogger(__name__)


class InvoiceExpiryService:
    """
    Service to handle automatic expiry of Lightning invoices
    
    This runs as a background process that periodically checks for expired invoices
    and updates their status in the database.
    """
    
    def __init__(self, check_interval_seconds: int = 900):
        """
        Initialize the expiry service
        
        Args:
            check_interval_seconds: How often to check for expired invoices (default 900 = 15 minutes)
        """
        self.supabase = get_supabase_client()
        self.lnbits_service = LNbitsService()
        self.check_interval = check_interval_seconds
        self._stop_event = Event()  # For graceful shutdown
        self._thread = None  # Background thread reference
        
        logger.info(f"InvoiceExpiryService initialized (check interval: {check_interval_seconds}s)")
    
    def find_expired_invoices(self) -> List[Dict]:
        """
        Query database for pending contributions with expired invoices
        
        Returns:
            List of contribution records that have expired invoices
        """
        try:
            # Query for pending contributions where invoice_expires_at has passed
            response = self.supabase.table('contributions').select(
                'id, campaign_id, lnbits_payment_hash, invoice_expires_at, amount'
            ).eq(
                'payment_status', 'pending'
            ).not_.is_(
                'invoice_expires_at', 'null'  # Only get invoices with expiry set
            ).lt(
                'invoice_expires_at', datetime.now().isoformat()  # Expiry time < now
            ).execute()
            
            expired = response.data if response.data else []
            
            if expired:
                logger.info(f"Found {len(expired)} expired invoices")
            
            return expired
            
        except Exception as e:
            logger.error(f"Error querying for expired invoices: {str(e)}")
            return []
    
    def verify_invoice_unpaid(self, payment_hash: str) -> bool:
        """
        Double-check with LNbits API that invoice is truly unpaid
        
        This prevents marking invoices as expired if they were paid in the last few seconds
        (edge case: payment arrives just as invoice expires)
        
        Args:
            payment_hash: The LNbits payment hash to check
            
        Returns:
            True if invoice is confirmed unpaid, False if it's actually paid
        """
        try:
            # Check actual payment status with LNbits
            payment_status = self.lnbits_service.check_invoice_status(payment_hash)
            
            # If it's paid, don't mark as expired!
            if payment_status.get('paid', False):
                logger.warning(
                    f"⚠️ Invoice {payment_hash} expired but was actually paid! "
                    f"Preventing incorrect expiry."
                )
                return False
            
            # Confirmed unpaid
            return True
            
        except LNbitsAPIError as e:
            # If LNbits returns 404 or error, invoice is likely expired/invalid
            logger.info(f"LNbits check failed for {payment_hash}: {str(e)}")
            return True  # Treat as unpaid/expired
        except Exception as e:
            logger.error(f"Error verifying invoice status: {str(e)}")
            return True  # Default to unpaid in case of errors
    
    def mark_invoice_expired(self, contribution_id: str) -> bool:
        """
        Update a contribution's status to 'expired' in the database
        
        Args:
            contribution_id: The contribution UUID to update
            
        Returns:
            True if update successful, False otherwise
        """
        try:
            # Update the contribution status
            update_data = {
                'payment_status': 'expired',
                'updated_at': datetime.now().isoformat()
            }
            
            response = self.supabase.table('contributions').update(
                update_data
            ).eq(
                'id', contribution_id
            ).execute()
            
            if response.data:
                logger.info(f"✅ Marked contribution {contribution_id} as expired")
                return True
            else:
                logger.error(f"Failed to update contribution {contribution_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error marking contribution as expired: {str(e)}")
            return False
    
    def process_expired_invoices(self) -> int:
        """
        Main processing function: Find and expire old invoices
        
        This is the core logic that runs on each check interval.
        
        Returns:
            Number of invoices successfully expired
        """
        logger.info("🔍 Checking for expired invoices...")
        
        # Step 1: Find all potentially expired invoices from database
        expired_invoices = self.find_expired_invoices()
        
        if not expired_invoices:
            logger.info("No expired invoices found")
            return 0
        
        # Step 2: Process each expired invoice
        expired_count = 0
        
        for invoice in expired_invoices:
            contribution_id = invoice['id']
            payment_hash = invoice.get('lnbits_payment_hash')
            
            # Step 3: Verify with LNbits that invoice is truly unpaid
            if payment_hash and not self.verify_invoice_unpaid(payment_hash):
                # Invoice was actually paid! Skip expiring it.
                # The webhook or polling should catch this payment soon.
                logger.info(
                    f"Skipping {contribution_id} - payment detected during expiry check"
                )
                continue
            
            # Step 4: Mark as expired in database
            if self.mark_invoice_expired(contribution_id):
                expired_count += 1
                
                # Step 5: Stop polling for this invoice (if polling service is running)
                try:
                    from services import InvoicePollingService
                    polling_service = InvoicePollingService()
                    polling_service.stop_polling(contribution_id)
                except Exception as e:
                    logger.warning(f"Could not stop polling for {contribution_id}: {e}")
        
        logger.info(f"✅ Expired {expired_count} invoices")
        return expired_count
    
    def run_once(self) -> int:
        """
        Run the expiry check once (for manual triggering or cron jobs)
        
        Returns:
            Number of invoices expired
        """
        try:
            return self.process_expired_invoices()
        except Exception as e:
            logger.error(f"❌ Error in expiry check: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return 0
    
    def run_forever(self):
        """
        Run the expiry check continuously in a loop
        
        This is meant to run in a background thread. It will check for expired
        invoices every `check_interval` seconds until stopped.
        """
        logger.info(f"🚀 Starting continuous expiry checker (interval: {self.check_interval}s)")
        
        while not self._stop_event.is_set():
            try:
                self.process_expired_invoices()
            except Exception as e:
                logger.error(f"Error in expiry loop: {str(e)}")
            
            # Wait for next check (or until stop event is set)
            self._stop_event.wait(self.check_interval)
        
        logger.info("Expiry service stopped")
    
    def start_background_thread(self):
        """
        Start the expiry service as a background thread
        
        This is useful for running the service alongside your Flask app.
        """
        if self._thread and self._thread.is_alive():
            logger.warning("Expiry service already running")
            return
        
        self._stop_event.clear()
        self._thread = Thread(target=self.run_forever, daemon=True)
        self._thread.start()
        
        logger.info("✅ Expiry service started in background thread")
    
    def stop(self):
        """
        Stop the background thread gracefully
        """
        if self._thread and self._thread.is_alive():
            logger.info("Stopping expiry service...")
            self._stop_event.set()
            self._thread.join(timeout=5)
            logger.info("Expiry service stopped")


# Singleton instance for easy import
_expiry_service = None

def get_expiry_service() -> InvoiceExpiryService:
    """Get or create the global expiry service instance"""
    global _expiry_service
    if _expiry_service is None:
        _expiry_service = InvoiceExpiryService()
    return _expiry_service