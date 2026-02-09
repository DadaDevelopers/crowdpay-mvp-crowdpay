"""
Contribution Routes for CrowdPay - Lightning Network Payments via LNbits

This module handles all contribution-related operations:
- Create contributions with LNbits Lightning invoices
- Check payment status (polling)
- Handle LNbits webhooks
- Cancel pending contributions
- List contributions

Payment Flow:
1. POST /api/contributions - Creates contribution + generates LNbits BOLT11 invoice
2. Frontend displays QR code with payment_request for user to scan
3. User pays with any Lightning wallet
4. GET /api/contributions/<id>/status - Frontend polls for payment confirmation
5. POST /api/webhooks/lnbits - LNbits webhook notifies backend (alternative to polling)
6. On payment: contribution marked as 'paid', campaign amount updated
"""

from flask import request, jsonify
from datetime import datetime
import logging
import uuid
from datetime import timedelta

from services.auth import optional_auth, require_auth
from . import contributions_bp
from models import Contribution
from services import get_supabase_client, LNbitsService, InvoicePollingService
from services.lnbits import LNbitsAPIError
from pydantic import ValidationError
from config import Config

logger = logging.getLogger(__name__)
supabase = get_supabase_client()
lnbits_service = LNbitsService()
polling_service = InvoicePollingService()


def btc_to_sats(btc: float) -> int:
    """Convert BTC to satoshis (1 BTC = 100,000,000 sats)"""
    return int(btc * 100_000_000)


@contributions_bp.route('', methods=['POST'])
@optional_auth
def create_contribution():
    """
    Create a new contribution and generate Lightning Network invoice

    Request Body:
    {
        "campaign_id": "uuid",
        "contributor_name": "John Doe" (optional),
        "contributor_email": "john@example.com" (optional),
        "amount": 1000,  // Amount in satoshis
        "currency": "SATS" or "BTC",
        "message": "Good luck!" (optional),
        "is_anonymous": false
    }

    Response (201 Created):
    {
        "message": "Contribution created successfully",
        "contribution": {...},
        "payment_request": "lnbc...",  // BOLT11 invoice to scan/pay
        "payment_hash": "abc123..."    // For checking payment status
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate campaign exists and is active
        campaign_id = data.get('campaign_id')
        if not campaign_id:
            return jsonify({'error': 'campaign_id is required'}), 400

        campaign_response = supabase.table('campaigns').select('*').eq(
            'id', campaign_id
        ).single().execute()

        if not campaign_response.data:
            return jsonify({'error': 'Campaign not found'}), 404

        campaign = campaign_response.data

        if campaign.get('status') != 'active':
            return jsonify({'error': 'Campaign is not active'}), 400

        # Convert BTC to SATS if needed
        amount = data.get('amount', 0)
        currency = data.get('currency', 'SATS').upper()

        if currency == 'BTC':
            amount = btc_to_sats(amount)
            currency = 'SATS'

        # Validate minimum amount (1 sat)
        if amount < 1:
            return jsonify({'error': 'Minimum contribution is 1 satoshi'}), 400

        # FIX 1: Ensure amount is an integer for satoshis
        amount = int(amount)
        data['amount'] = amount
        data['currency'] = currency

        # Handle anonymous contributions before creating model
        if data.get('is_anonymous', False):
            data['contributor_name'] = None
            data['contributor_email'] = None

        # Create Lightning invoice via LNbits API FIRST (before database)
        try:
            # Generate memo/description for the invoice
            memo = f"CrowdPay: {campaign.get('title', 'Campaign')[:50]}"
            if data.get('contributor_name') and not data.get('is_anonymous', False):
                memo += f" from {data['contributor_name']}"

            logger.info(f"Creating LNbits invoice for {amount} sats")

            # Call LNbits API to create invoice
            payment_data = lnbits_service.create_invoice(
                amount=amount,
                memo=memo,
                expiry=3600  # 1 hour expiry
            )
            #set auto-expiry for invoices
            invoice_expires_at = datetime.now() + timedelta(seconds=3600)
            data['invoice_expires_at'] = invoice_expires_at

            logger.info(f"LNbits invoice created: {payment_data['payment_hash']}")

            # FIX 2: Add LNbits data to the request data BEFORE creating model
            data['lnbits_payment_hash'] = payment_data['payment_hash']
            data['lnbits_payment_request'] = payment_data['payment_request']
            data['lnbits_checking_id'] = payment_data.get('checking_id')
            # data['lnbits_reference'] = f"contrib_{uuid.uuid4().hex[:12]}"
            data['payment_status'] = 'pending'
            
            # FIX 3: Set timestamps
            now = datetime.now()
            data['created_at'] = now
            data['updated_at'] = now

            # Create contribution model with all data
            contribution = Contribution(**data)

            # Insert contribution into database
            contrib_data = contribution.to_dict()
            contrib_data.pop('id', None)  # Let database generate ID

            response = supabase.table('contributions').insert(contrib_data).execute()
            
            if not response.data:
                return jsonify({'error': 'Failed to create contribution'}), 500

            created_contribution = Contribution.from_dict(response.data[0])

            # Start polling service to check for payment
            polling_service.start_polling(
                contribution_id=created_contribution.id,
                payment_hash=payment_data['payment_hash'],
                campaign_id=campaign_id
            )

            logger.info(f"✅ Contribution created: {created_contribution.id}")

            return jsonify({
                'message': 'Contribution created successfully',
                'contribution': created_contribution.dict(),
                'payment_request': payment_data['payment_request'],
                'payment_hash': payment_data['payment_hash']
            }), 201

        except LNbitsAPIError as e:
            logger.error(f"❌ LNbits API error: {str(e)}")
            return jsonify({
                'error': 'Payment processing error',
                'details': str(e)
            }), 400

    except ValidationError as e:
        logger.error(f"Validation error: {e.errors()}")
        return jsonify({
            'error': 'Validation error',
            'details': e.errors()
        }), 400
    except Exception as e:
        logger.error(f"❌ Error creating contribution: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500


@contributions_bp.route('/<contribution_id>', methods=['GET'])
@optional_auth
def get_contribution(contribution_id):
    """Get a specific contribution by ID"""
    try:
        response = supabase.table('contributions').select('*').eq(
            'id', contribution_id
        ).single().execute()

        if not response.data:
            return jsonify({'error': 'Contribution not found'}), 404

        contribution = Contribution.from_dict(response.data)

        # Hide personal info if anonymous
        contrib_dict = contribution.dict()
        if contribution.is_anonymous:
            contrib_dict['contributor_name'] = 'Anonymous'
            contrib_dict['contributor_email'] = None

        return jsonify({'contribution': contrib_dict}), 200

    except Exception as e:
        logger.error(f"Error fetching contribution: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@contributions_bp.route('/<contribution_id>/status', methods=['GET'])
@optional_auth
def check_contribution_status(contribution_id):
    """
    Check the payment status of a contribution

    Frontend should poll this endpoint every few seconds to check if payment completed.
    This checks LNbits API directly for the latest payment status.

    Response:
    {
        "contribution_id": "uuid",
        "payment_status": "pending|paid|failed|expired",
        "is_paid": true/false,
        "paid_at": "2024-01-01T00:00:00Z" or null
    }
    """
    try:
        response = supabase.table('contributions').select('*').eq(
            'id', contribution_id
        ).single().execute()

        if not response.data:
            return jsonify({'error': 'Contribution not found'}), 404

        contribution = Contribution.from_dict(response.data)

        # If pending and has payment hash, check with LNbits
        if contribution.is_pending() and contribution.get_payment_hash():
            try:
                # Check payment status with LNbits API
                payment_status = lnbits_service.check_invoice_status(
                    contribution.get_payment_hash()
                )

                # Update if payment confirmed
                if payment_status.get('paid') and not contribution.is_paid():
                    logger.info(f"⚡ Payment confirmed for contribution: {contribution_id}")

                    # FIX 4: Calculate platform fee correctly
                    amount = float(contribution.amount)
                    platform_fee = amount * (Config.PLATFORM_FEE_PERCENT / 100)
                    creator_amount = amount - platform_fee

                    update_data = {
                        'payment_status': 'paid',
                        'paid_at': datetime.now().isoformat(),
                        'transaction_id': payment_status.get('preimage'),
                        'updated_at': datetime.now().isoformat()
                    }

                    supabase.table('contributions').update(update_data).eq(
                        'id', contribution_id
                    ).execute()

                    # Update campaign current_amount
                    campaign_id = contribution.campaign_id
                    campaign_response = supabase.table('campaigns').select(
                        'current_amount'
                    ).eq('id', campaign_id).single().execute()

                    if campaign_response.data:
                        current = float(campaign_response.data.get('current_amount', 0))
                        new_amount = current + creator_amount
                        
                        supabase.table('campaigns').update({
                            'current_amount': new_amount,
                            'updated_at': datetime.now().isoformat()
                        }).eq('id', campaign_id).execute()

                        logger.info(f"Campaign {campaign_id} updated with {creator_amount} sats")

                    # Stop polling
                    polling_service.stop_polling(contribution_id)

                    # Update local object
                    contribution.payment_status = 'paid'
                    contribution.paid_at = datetime.now()

            except LNbitsAPIError as e:
                logger.error(f"Error checking LNbits status: {str(e)}")

        return jsonify({
            'contribution_id': contribution_id,
            'payment_status': contribution.payment_status,
            'is_paid': contribution.is_paid(),
            'paid_at': contribution.paid_at.isoformat() if contribution.paid_at else None
        }), 200

    except Exception as e:
        logger.error(f"Error checking contribution status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@contributions_bp.route('/<contribution_id>/cancel', methods=['POST'])
@require_auth
def cancel_contribution(contribution_id):
    """Cancel a pending contribution"""
    try:
        response = supabase.table('contributions').select('*').eq(
            'id', contribution_id
        ).single().execute()

        if not response.data:
            return jsonify({'error': 'Contribution not found'}), 404

        contribution = Contribution.from_dict(response.data)

        # Can only cancel pending contributions
        if not contribution.is_pending():
            return jsonify({
                'error': 'Can only cancel pending contributions'
            }), 400

        # Lightning invoices expire automatically after expiry time
        # We just stop polling and mark as cancelled
        if contribution.get_payment_hash():
            logger.info(f"Lightning invoice will expire: {contribution.get_payment_hash()}")

        # Stop polling
        polling_service.stop_polling(contribution_id)

        # Update contribution status to cancelled
        supabase.table('contributions').update({
            'payment_status': 'cancelled',
            'updated_at': datetime.now().isoformat()
        }).eq('id', contribution_id).execute()

        logger.info(f"Contribution cancelled: {contribution_id}")

        return jsonify({'message': 'Contribution cancelled successfully'}), 200

    except Exception as e:
        logger.error(f"Error cancelling contribution: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@contributions_bp.route('', methods=['GET'])
@optional_auth
def get_contributions():
    """
    Get all contributions with optional filtering

    Query parameters:
    - campaign_id: Filter by campaign
    - payment_status: Filter by status (pending, paid, etc.)
    - limit: Max results (default 50)
    - offset: Pagination offset (default 0)
    """
    try:
        # Get query parameters
        campaign_id = request.args.get('campaign_id')
        payment_status = request.args.get('payment_status')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Build query
        query = supabase.table('contributions').select('*')

        if campaign_id:
            query = query.eq('campaign_id', campaign_id)

        if payment_status:
            query = query.eq('payment_status', payment_status)

        # Execute query with pagination
        response = query.order('created_at', desc=True).range(
            offset, offset + limit - 1
        ).execute()

        contributions = response.data

        # Filter anonymous contributor info
        for contrib in contributions:
            if contrib.get('is_anonymous'):
                contrib['contributor_name'] = 'Anonymous'
                contrib['contributor_email'] = None

        return jsonify({
            'contributions': contributions,
            'count': len(contributions),
            'offset': offset,
            'limit': limit
        }), 200

    except Exception as e:
        logger.error(f"Error fetching contributions: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@contributions_bp.route('/webhook', methods=['POST'])
def lnbits_webhook():
    """
    Webhook endpoint for LNbits payment notifications

    LNbits will POST to this endpoint when a payment is received.
    This is an alternative to polling - more efficient for production.

    Expected payload from LNbits:
    {
        "payment_hash": "abc123...",
        "payment_request": "lnbc...",
        "amount": 1000,
        "memo": "...",
        "paid": true,
        "preimage": "xyz..."
    }
    """
    try:
        # Get raw payload for signature verification
        payload = request.get_data(as_text=True)
        signature = request.headers.get('X-LNbits-Signature', '')

        # Verify webhook signature if present (recommended for security)
        if signature and not lnbits_service.verify_webhook_signature(payload, signature):
            logger.warning("⚠️ Invalid webhook signature")
            # Continue anyway as signature verification is optional

        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        payment_hash = data.get('payment_hash')
        is_paid = data.get('paid', False)

        if not payment_hash:
            return jsonify({'error': 'Payment hash required'}), 400

        # Only process if payment is confirmed
        if not is_paid:
            logger.info(f"Webhook received for unpaid invoice: {payment_hash}")
            return jsonify({'message': 'Payment not yet confirmed'}), 200

        logger.info(f"⚡ Webhook: Payment received for {payment_hash}")

        # Find contribution by payment hash
        response = supabase.table('contributions').select('*').eq(
            'lnbits_payment_hash', payment_hash
        ).execute()

        if not response.data:
            logger.warning(f"⚠️ No contribution found for payment_hash: {payment_hash}")
            return jsonify({'message': 'Contribution not found'}), 404

        contribution_data = response.data[0]
        contribution_id = contribution_data['id']
        campaign_id = contribution_data['campaign_id']

        # Check if already processed
        if contribution_data['payment_status'] == 'paid':
            logger.info(f"Contribution {contribution_id} already marked as paid")
            return jsonify({'message': 'Already processed'}), 200

        # FIX 5: Calculate platform fee correctly from amount
        amount = float(contribution_data['amount'])
        platform_fee = amount * (Config.PLATFORM_FEE_PERCENT / 100)
        creator_amount = amount - platform_fee

        # Update contribution status to paid
        update_data = {
            'payment_status': 'paid',
            'paid_at': datetime.now().isoformat(),
            'transaction_id': data.get('preimage'),
            'updated_at': datetime.now().isoformat()
        }

        supabase.table('contributions').update(update_data).eq(
            'id', contribution_id
        ).execute()

        # Update campaign amount with platform fee deduction
        campaign_response = supabase.table('campaigns').select(
            'current_amount'
        ).eq('id', campaign_id).single().execute()

        if campaign_response.data:
            current = float(campaign_response.data.get('current_amount', 0))
            new_amount = current + creator_amount
            
            supabase.table('campaigns').update({
                'current_amount': new_amount,
                'updated_at': datetime.now().isoformat()
            }).eq('id', campaign_id).execute()

            logger.info(f"✅ Campaign {campaign_id} updated: +{creator_amount} sats")

        # Stop polling service
        polling_service.stop_polling(contribution_id)

        logger.info(f"✅ Webhook processed: Contribution {contribution_id} marked as paid")

        return jsonify({'message': 'Webhook processed successfully'}), 200

    except Exception as e:
        logger.error(f"❌ Error processing webhook: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500
