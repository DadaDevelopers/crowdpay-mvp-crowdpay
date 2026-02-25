"""
Contribution Routes for CrowdPay - Non-Custodial Lightning Payments via LNURL-pay

This module handles all contribution-related operations:
- Create contributions with invoices from creator's wallet (LNURL-pay)
- Check payment status
- Creator confirms payments manually
- Cancel pending contributions
- List contributions

Non-Custodial Payment Flow:
1. POST /api/contributions - Fetches invoice from creator's Lightning wallet via LNURL-pay
2. Frontend displays QR code with invoice for contributor to scan
3. Contributor pays creator directly (platform never holds funds)
4. GET /api/contributions/<id>/status - Frontend polls for status
5. POST /api/contributions/<id>/confirm - Creator confirms payment received
"""

from flask import request, jsonify
from datetime import datetime, timedelta
import logging

from services.auth import optional_auth, require_auth
from . import contributions_bp
from models import Contribution
from services import get_supabase_client
from services.lnurl_service import get_invoice, generate_callback_token
from config import Config
from pydantic import ValidationError

logger = logging.getLogger(__name__)
supabase = get_supabase_client()


def btc_to_sats(btc: float) -> int:
    """Convert BTC to satoshis (1 BTC = 100,000,000 sats)"""
    return int(btc * 100_000_000)


@contributions_bp.route('', methods=['POST'])
@optional_auth
def create_contribution():
    """
    Create a new contribution and generate Lightning invoice from creator's wallet.

    Uses LNURL-pay to fetch an invoice directly from the campaign creator's
    Lightning wallet. The platform never holds funds.

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
        "contribution_id": "uuid",
        "invoice": "lnbc...",
        "payment_hash": "abc123...",
        "amount_sats": 1000,
        "expires_at": "2025-01-01T00:15:00"
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

        # Look up creator's lightning address
        creator_id = campaign.get('creator_id')
        creator_response = supabase.table('users').select(
            'lightning_address'
        ).eq('id', creator_id).single().execute()

        if not creator_response.data or not creator_response.data.get('lightning_address'):
            return jsonify({
                'error': 'Campaign creator has not set up a Lightning wallet. Please contact the campaign creator.'
            }), 400

        lightning_address = creator_response.data['lightning_address']

        # Convert BTC to SATS if needed
        amount = data.get('amount', 0)
        currency = data.get('currency', 'SATS').upper()

        if currency == 'BTC':
            amount = btc_to_sats(amount)
            currency = 'SATS'

        # Validate minimum amount (1 sat)
        if amount < 1:
            return jsonify({'error': 'Minimum contribution is 1 satoshi'}), 400

        amount = int(amount)
        data['amount'] = amount
        data['currency'] = currency

        # Handle anonymous contributions
        if data.get('is_anonymous', False):
            data['contributor_name'] = None
            data['contributor_email'] = None

        # Generate comment for the invoice
        comment = f"CrowdPay: {campaign.get('title', 'Campaign')[:50]}"
        if data.get('contributor_name') and not data.get('is_anonymous', False):
            comment += f" from {data['contributor_name']}"

        # Get invoice from creator's wallet via LNURL-pay
        logger.info(f"Requesting invoice from {lightning_address} for {amount} sats")
        invoice_result = get_invoice(lightning_address, amount, comment)

        if 'error' in invoice_result:
            logger.error(f"LNURL invoice error: {invoice_result['error']}")
            return jsonify({
                'error': 'Failed to generate invoice from creator wallet',
                'details': invoice_result['error']
            }), 400

        # Set timestamps and invoice data
        now = datetime.now()
        expires_at = now + timedelta(minutes=15)

        data['invoice'] = invoice_result['invoice']
        data['payment_hash'] = invoice_result.get('payment_hash')
        data['payment_status'] = 'pending'
        data['created_at'] = now
        data['updated_at'] = now
        data['invoice_expires_at'] = expires_at

        # Create contribution model
        contribution = Contribution(**data)

        # Insert into database
        contrib_data = contribution.to_dict()
        contrib_data.pop('id', None)  # Let database generate ID

        response = supabase.table('contributions').insert(contrib_data).execute()

        if not response.data:
            return jsonify({'error': 'Failed to create contribution'}), 500

        created = response.data[0]

        logger.info(f"Contribution created: {created['id']}")

        # Generate callback URL for automated payment confirmation
        payment_hash = invoice_result.get('payment_hash')
        callback_url = None
        if payment_hash:
            token = generate_callback_token(payment_hash)
            base = Config.CALLBACK_BASE_URL.rstrip('/')
            callback_url = f"{base}/api/lnurl/callback?payment_hash={payment_hash}&token={token}"

        return jsonify({
            'message': 'Contribution created successfully',
            'contribution_id': created['id'],
            'invoice': invoice_result['invoice'],
            'payment_hash': payment_hash,
            'amount_sats': amount,
            'expires_at': expires_at.isoformat(),
            'callback_url': callback_url,
        }), 201

    except ValidationError as e:
        logger.error(f"Validation error: {e.errors()}")
        return jsonify({
            'error': 'Validation error',
            'details': e.errors()
        }), 400
    except Exception as e:
        logger.error(f"Error creating contribution: {str(e)}")
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
    Check the payment status of a contribution.

    Returns the current DB status. In the LNURL model, status changes
    when the campaign creator confirms the payment.

    Response:
    {
        "contribution_id": "uuid",
        "payment_status": "pending|completed|failed|expired",
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

        return jsonify({
            'contribution_id': contribution_id,
            'payment_status': contribution.payment_status,
            'is_paid': contribution.is_paid(),
            'paid_at': contribution.paid_at.isoformat() if contribution.paid_at else None
        }), 200

    except Exception as e:
        logger.error(f"Error checking contribution status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@contributions_bp.route('/<contribution_id>/confirm', methods=['POST'])
@require_auth
def confirm_contribution(contribution_id):
    """
    Confirm a contribution payment (campaign creator only).

    The creator confirms they received the Lightning payment in their wallet.
    This updates the contribution status and increments the campaign amount.

    Response:
    {
        "message": "Contribution confirmed",
        "contribution_id": "uuid",
        "amount_sats": 1000
    }
    """
    try:
        # Fetch the contribution
        response = supabase.table('contributions').select('*').eq(
            'id', contribution_id
        ).single().execute()

        if not response.data:
            return jsonify({'error': 'Contribution not found'}), 404

        contribution = Contribution.from_dict(response.data)

        # Verify the requesting user is the campaign creator
        campaign_response = supabase.table('campaigns').select(
            'creator_id'
        ).eq('id', contribution.campaign_id).single().execute()

        if not campaign_response.data:
            return jsonify({'error': 'Campaign not found'}), 404

        if campaign_response.data['creator_id'] != request.user['id']:
            return jsonify({'error': 'Only the campaign creator can confirm contributions'}), 403

        # Can only confirm pending contributions
        if not contribution.is_pending():
            return jsonify({
                'error': f'Cannot confirm contribution with status: {contribution.payment_status}'
            }), 400

        now = datetime.now()

        # Update contribution status
        supabase.table('contributions').update({
            'payment_status': 'completed',
            'paid_at': now.isoformat(),
            'confirmed_by': 'manual',
            'updated_at': now.isoformat()
        }).eq('id', contribution_id).execute()

        # Update campaign current_amount (full amount, no platform fee deduction)
        campaign_full = supabase.table('campaigns').select(
            'current_amount'
        ).eq('id', contribution.campaign_id).single().execute()

        if campaign_full.data:
            current = float(campaign_full.data.get('current_amount', 0))
            new_amount = current + contribution.amount

            supabase.table('campaigns').update({
                'current_amount': new_amount,
                'updated_at': now.isoformat()
            }).eq('id', contribution.campaign_id).execute()

            logger.info(f"Campaign {contribution.campaign_id} updated: +{contribution.amount} sats")

        logger.info(f"Contribution confirmed: {contribution_id}")

        return jsonify({
            'message': 'Contribution confirmed',
            'contribution_id': contribution_id,
            'amount_sats': contribution.amount
        }), 200

    except Exception as e:
        logger.error(f"Error confirming contribution: {str(e)}")
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
    - payment_status: Filter by status (pending, completed, etc.)
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
