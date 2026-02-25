"""
LNURL Service for CrowdPay - Non-Custodial Lightning Payments

Implements the LNURL-pay protocol to generate invoices directly from
campaign creators' Lightning wallets. The platform never holds funds.

Flow:
1. Creator sets Lightning address (e.g., user@blink.sv) in profile
2. Contributor wants to pay -> we call creator's LNURL-pay endpoint
3. Creator's wallet generates a BOLT11 invoice
4. Contributor pays creator directly
5. Creator confirms payment in CrowdPay
"""

import re
import hmac
import hashlib
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

LNURL_TIMEOUT = 10  # seconds


def validate_lightning_address(address: str) -> dict:
    """
    Validate a Lightning address by resolving it via LNURL-pay protocol.

    Parses user@domain, fetches the LNURL-pay metadata from
    https://{domain}/.well-known/lnurlp/{user}, and returns
    the callback URL and receive limits.

    Returns:
        dict with keys:
            - valid (bool)
            - callback_url (str)
            - min_receivable_sats (int)
            - max_receivable_sats (int)
            - metadata (str)
            - error (str, only if valid=False)
    """
    address = address.strip()

    # Parse user@domain format
    match = re.match(r'^([^@]+)@([^@]+\.[^@]+)$', address)
    if not match:
        return {'valid': False, 'error': 'Invalid format. Use user@domain (e.g., name@getalby.com)'}

    user, domain = match.group(1), match.group(2)
    url = f'https://{domain}/.well-known/lnurlp/{user}'

    try:
        with httpx.Client(timeout=LNURL_TIMEOUT) as client:
            resp = client.get(url, follow_redirects=True)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        return {'valid': False, 'error': f'Timeout connecting to {domain}'}
    except httpx.HTTPStatusError as e:
        return {'valid': False, 'error': f'Lightning address not found at {domain} (HTTP {e.response.status_code})'}
    except Exception as e:
        return {'valid': False, 'error': f'Failed to resolve Lightning address: {str(e)}'}

    # Check for LNURL error response
    if data.get('status') == 'ERROR':
        return {'valid': False, 'error': data.get('reason', 'Unknown LNURL error')}

    callback = data.get('callback')
    if not callback:
        return {'valid': False, 'error': 'Invalid LNURL-pay response: missing callback URL'}

    min_receivable = data.get('minSendable', 1000)  # millisats
    max_receivable = data.get('maxSendable', 100_000_000_000)  # millisats

    return {
        'valid': True,
        'callback_url': callback,
        'min_receivable_sats': min_receivable // 1000,
        'max_receivable_sats': max_receivable // 1000,
        'metadata': data.get('metadata', ''),
    }


def get_invoice(address: str, amount_sats: int, comment: Optional[str] = None) -> dict:
    """
    Request a BOLT11 invoice from a Lightning address via LNURL-pay.

    1. Resolves the Lightning address to get the callback URL
    2. Calls the callback with amount in millisats
    3. Decodes the returned BOLT11 invoice to extract payment_hash

    Returns:
        dict with keys:
            - invoice (str): BOLT11 invoice string
            - payment_hash (str): hex-encoded payment hash
            - amount_sats (int): amount in satoshis
            - error (str, only on failure)
    """
    # First validate and get callback URL
    validation = validate_lightning_address(address)
    if not validation['valid']:
        return {'error': validation['error']}

    callback_url = validation['callback_url']
    amount_msats = amount_sats * 1000

    # Check limits
    min_sats = validation['min_receivable_sats']
    max_sats = validation['max_receivable_sats']
    if amount_sats < min_sats:
        return {'error': f'Amount too low. Minimum is {min_sats} sats'}
    if amount_sats > max_sats:
        return {'error': f'Amount too high. Maximum is {max_sats} sats'}

    # Build callback params
    separator = '&' if '?' in callback_url else '?'
    url = f'{callback_url}{separator}amount={amount_msats}'
    if comment:
        url += f'&comment={comment[:255]}'

    try:
        with httpx.Client(timeout=LNURL_TIMEOUT) as client:
            resp = client.get(url, follow_redirects=True)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        return {'error': 'Timeout requesting invoice from wallet'}
    except Exception as e:
        return {'error': f'Failed to get invoice: {str(e)}'}

    if data.get('status') == 'ERROR':
        return {'error': data.get('reason', 'Wallet returned an error')}

    pr = data.get('pr')
    if not pr:
        return {'error': 'No invoice returned from wallet'}

    # Extract payment_hash from BOLT11 invoice
    # The payment_hash is typically in the tagged data of the invoice.
    # We use a lightweight extraction rather than a full BOLT11 decoder.
    payment_hash = _extract_payment_hash(pr)

    return {
        'invoice': pr,
        'payment_hash': payment_hash,
        'amount_sats': amount_sats,
    }


# Bech32 charset for BOLT11 decoding
BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'


def _bech32_decode_data(data_str: str) -> bytes:
    """Decode bech32-encoded data portion of a BOLT11 invoice to bytes."""
    values = [BECH32_CHARSET.index(c) for c in data_str]
    # Convert 5-bit values to 8-bit bytes
    acc = 0
    bits = 0
    result = []
    for v in values:
        acc = (acc << 5) | v
        bits += 5
        while bits >= 8:
            bits -= 8
            result.append((acc >> bits) & 0xFF)
    return bytes(result)


def _extract_payment_hash(bolt11_invoice: str) -> Optional[str]:
    """
    Extract the payment_hash from a BOLT11 invoice string.

    The payment_hash is in tagged field type 1 (payment hash),
    which is 52 bech32 characters (32 bytes) of data.
    """
    try:
        # Remove lightning: prefix if present
        invoice = bolt11_invoice.lower().strip()
        if invoice.startswith('lightning:'):
            invoice = invoice[10:]

        # Find the separator '1' (last occurrence before data)
        sep_idx = invoice.rindex('1')
        data_part = invoice[sep_idx + 1:]

        # Remove the checksum (last 6 characters)
        data_part = data_part[:-6]

        # Skip the timestamp (first 7 characters of 5-bit data)
        pos = 7

        # Parse tagged fields
        while pos + 3 <= len(data_part):
            tag = BECH32_CHARSET.index(data_part[pos])
            data_len = (BECH32_CHARSET.index(data_part[pos + 1]) << 5) | BECH32_CHARSET.index(data_part[pos + 2])
            pos += 3

            if pos + data_len > len(data_part):
                break

            if tag == 1:  # payment_hash tag
                hash_data = data_part[pos:pos + data_len]
                hash_bytes = _bech32_decode_data(hash_data)
                return hash_bytes[:32].hex()

            pos += data_len

        logger.warning('payment_hash tag not found in BOLT11 invoice')
        return None
    except Exception as e:
        logger.warning(f'Failed to extract payment_hash from BOLT11: {e}')
        return None


def generate_callback_token(payment_hash: str) -> str:
    """
    Generate an HMAC-SHA256 token for a payment_hash.

    Used to authenticate LNURL callback requests without needing
    extra DB columns. The token is included in the callback URL.
    """
    from config import Config
    key = Config.SECRET_KEY.encode()
    return hmac.new(key, payment_hash.encode(), hashlib.sha256).hexdigest()


def verify_callback_token(payment_hash: str, token: str) -> bool:
    """
    Verify an HMAC callback token against a payment_hash.

    Uses constant-time comparison to prevent timing attacks.
    """
    expected = generate_callback_token(payment_hash)
    return hmac.compare_digest(expected, token)


def verify_payment_preimage(payment_hash: str, preimage: str) -> bool:
    """
    Verify a Lightning payment preimage against the payment_hash.

    In the Lightning protocol, payment_hash = SHA256(preimage).
    If someone provides a valid preimage, it proves payment was made.
    """
    try:
        preimage_bytes = bytes.fromhex(preimage)
        expected_hash = hashlib.sha256(preimage_bytes).hexdigest()
        return hmac.compare_digest(expected_hash, payment_hash)
    except (ValueError, TypeError):
        return False
