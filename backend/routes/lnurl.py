"""
LNURL Callback Routes for CrowdPay - Automated Payment Confirmation

Provides a callback endpoint that wallet services or external systems can call
to confirm Lightning payments programmatically. Supports two verification methods:

1. HMAC token: Generated when contribution is created, included in callback URL
2. Payment preimage: SHA256(preimage) == payment_hash (cryptographic proof)

The existing manual confirmation and frontend polling remain as fallbacks.
"""

import re
from datetime import datetime
import logging

from flask import request, jsonify

from . import lnurl_bp
from models import Contribution
from services import get_supabase_client
from services.lnurl_service import verify_callback_token, verify_payment_preimage

logger = logging.getLogger(__name__)
supabase = get_supabase_client()

PAYMENT_HASH_RE = re.compile(r'^[0-9a-f]{64}$')


def _process_callback(data):
    """
    Process a payment callback (shared by GET and POST handlers).

    Verifies the request via HMAC token or payment preimage,
    then marks the contribution as completed and updates the campaign.
    """
    payment_hash = data.get('payment_hash', '').strip().lower()
    if not payment_hash:
        return jsonify({'error': 'payment_hash is required'}), 400

    if not PAYMENT_HASH_RE.match(payment_hash):
        return jsonify({'error': 'Invalid payment_hash format (expected 64 hex chars)'}), 400

    # Verify authentication: HMAC token or payment preimage
    token = data.get('token', '').strip()
    preimage = data.get('payment_preimage', '').strip()

    token_valid = token and verify_callback_token(payment_hash, token)
    preimage_valid = preimage and verify_payment_preimage(payment_hash, preimage)

    if not token_valid and not preimage_valid:
        return jsonify({'error': 'Invalid or missing authentication (token or payment_preimage)'}), 403

    # Look up contribution by payment_hash
    try:
        response = supabase.table('contributions').select('*').eq(
            'payment_hash', payment_hash
        ).single().execute()
    except Exception as e:
        logger.error(f"DB error looking up payment_hash {payment_hash}: {e}")
        return jsonify({'error': 'Contribution not found'}), 404

    if not response.data:
        return jsonify({'error': 'Contribution not found'}), 404

    contribution = Contribution.from_dict(response.data)

    # Idempotent: already paid
    if contribution.is_paid():
        return jsonify({
            'status': 'already_confirmed',
            'contribution_id': str(contribution.id),
        }), 200

    # Only pending contributions can be confirmed
    if not contribution.is_pending():
        return jsonify({
            'error': f'Cannot confirm contribution with status: {contribution.payment_status}',
        }), 409

    # Determine confirmation source
    if preimage_valid:
        confirmed_by = 'lnurl_callback_preimage'
    else:
        confirmed_by = 'lnurl_callback'

    now = datetime.now()

    # Build update payload
    update_data = {
        'payment_status': 'completed',
        'paid_at': now.isoformat(),
        'confirmed_by': confirmed_by,
        'updated_at': now.isoformat(),
    }

    # Store preimage in transaction_id if provided
    if preimage_valid and preimage:
        update_data['transaction_id'] = preimage

    # Update contribution
    try:
        supabase.table('contributions').update(update_data).eq(
            'id', str(contribution.id)
        ).execute()
    except Exception as e:
        logger.error(f"Failed to update contribution {contribution.id}: {e}")
        return jsonify({'error': 'Failed to confirm contribution'}), 500

    logger.info(f"Contribution {contribution.id} confirmed via {confirmed_by}")

    # Update campaign current_amount
    try:
        campaign_response = supabase.table('campaigns').select(
            'current_amount'
        ).eq('id', str(contribution.campaign_id)).single().execute()

        if campaign_response.data:
            current = float(campaign_response.data.get('current_amount', 0))
            new_amount = current + contribution.amount

            supabase.table('campaigns').update({
                'current_amount': new_amount,
                'updated_at': now.isoformat()
            }).eq('id', str(contribution.campaign_id)).execute()

            logger.info(f"Campaign {contribution.campaign_id} updated: +{contribution.amount} sats")
    except Exception as e:
        logger.error(f"Failed to update campaign {contribution.campaign_id} amount: {e}")
        # Don't roll back contribution confirmation

    return jsonify({
        'status': 'confirmed',
        'contribution_id': str(contribution.id),
        'amount_sats': contribution.amount,
    }), 200


@lnurl_bp.route('/callback', methods=['POST'])
def callback_post():
    """Handle POST callback from wallet services."""
    data = request.get_json(silent=True) or {}
    # Also check query params as fallback
    for key in ('payment_hash', 'token', 'payment_preimage'):
        if key not in data and request.args.get(key):
            data[key] = request.args.get(key)
    return _process_callback(data)


@lnurl_bp.route('/callback', methods=['GET'])
def callback_get():
    """Handle GET callback for wallet compatibility."""
    data = {
        'payment_hash': request.args.get('payment_hash', ''),
        'token': request.args.get('token', ''),
        'payment_preimage': request.args.get('payment_preimage', ''),
    }
    return _process_callback(data)
