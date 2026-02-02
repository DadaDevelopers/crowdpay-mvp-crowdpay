from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class Contribution(BaseModel):
    """
    Contribution model for campaign donations via Lightning Network (LNbits)

    Lightning Payment Flow:
    1. User initiates contribution via POST /api/contributions
    2. Backend creates LNbits invoice and returns payment_request (BOLT11)
    3. Frontend displays QR code for user to scan/pay with Lightning wallet
    4. Backend polls LNbits API OR receives webhook for payment confirmation
    5. On payment, contribution status updated to 'paid' and campaign amount incremented
    """

    # Core fields
    id: Optional[str] = None
    campaign_id: str = Field(..., min_length=1)
    contributor_name: Optional[str] = Field(None, max_length=100)
    contributor_email: Optional[str] = None
    # FIX 1: Changed amount to int since satoshis are always integers
    amount: int = Field(..., gt=0)  # Amount in satoshis (always integer)
    currency: str = Field(default="SATS")  # Lightning-only: always SATS
    payment_status: str = Field(default="pending")

    # LNbits Lightning Network payment fields
    lnbits_payment_hash: Optional[str] = Field(
        None,
        description="Unique payment hash from LNbits - used to identify the payment"
    )
    lnbits_payment_request: Optional[str] = Field(
        None,
        description="BOLT11 Lightning invoice string - scan this as QR code or paste in wallet"
    )
    lnbits_checking_id: Optional[str] = Field(
        None,
        description="LNbits checking ID - used to poll payment status"
    )
    # lnbits_reference: Optional[str] = Field(
    #     None,
    #     description="Internal reference for tracking contributions in our system"
    # )

    # Payment details
    transaction_id: Optional[str] = Field(
        None,
        description="Payment preimage - cryptographic proof that payment was completed"
    )
    message: Optional[str] = Field(None, max_length=500)
    is_anonymous: bool = Field(default=False)
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

    # Platform fee tracking (calculated, not stored)
    platform_fee: Optional[float] = None
    creator_amount: Optional[float] = None

    @validator('payment_status')
    def validate_payment_status(cls, v):
        """Validate payment status is one of the allowed values"""
        allowed_statuses = ['pending', 'paid', 'failed', 'expired', 'cancelled']
        if v not in allowed_statuses:
            raise ValueError(f"Payment status must be one of {allowed_statuses}")
        return v

    @validator('currency')
    def validate_currency(cls, v):
        """Validate currency - Lightning Network uses SATS"""
        allowed_currencies = ['SATS', 'BTC']
        v = v.upper()
        if v not in allowed_currencies:
            raise ValueError(f"Currency must be one of {allowed_currencies}")
        return v

    # FIX 2: Updated validator to work with int type
    @validator('amount')
    def validate_amount(cls, v):
        """Validate amount is positive and meets minimum"""
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        if v < 100:
            raise ValueError("Minimum contribution is 100 satoshis")
        return v

    # FIX 3: Added validator to coerce amount to int if float is provided
    @validator('amount', pre=True)
    def coerce_amount_to_int(cls, v):
        """Coerce amount to integer (satoshis are always whole numbers)"""
        if isinstance(v, float):
            return int(v)
        return v

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for database operations"""
        data = self.dict(exclude_none=True)

        # Convert datetime objects to ISO format strings
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        if self.updated_at:
            data['updated_at'] = self.updated_at.isoformat()
        if self.paid_at:
            data['paid_at'] = self.paid_at.isoformat()

        # Remove calculated fields that shouldn't be stored
        data.pop('platform_fee', None)
        data.pop('creator_amount', None)

        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Contribution':
        """Create Contribution instance from database dictionary"""
        # Make a copy to avoid modifying original
        data = data.copy()
        
        # FIX 4: Ensure amount is int when loading from database
        if 'amount' in data and not isinstance(data['amount'], int):
            data['amount'] = int(data['amount'])
        
        # Handle datetime strings from database
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
        if 'paid_at' in data and data['paid_at'] and isinstance(data['paid_at'], str):
            data['paid_at'] = datetime.fromisoformat(data['paid_at'].replace('Z', '+00:00'))

        return cls(**data)

    # Status check methods
    def is_paid(self) -> bool:
        """Check if contribution has been successfully paid"""
        return self.payment_status == 'paid'

    def is_pending(self) -> bool:
        """Check if contribution is awaiting payment"""
        return self.payment_status == 'pending'
    
    def is_cancelled(self) -> bool:
        """Check if contribution has been cancelled"""
        return self.payment_status == 'cancelled'
    
    def is_expired(self) -> bool:
        """Check if Lightning invoice has expired"""
        return self.payment_status == 'expired'
    
    def is_failed(self) -> bool:
        """Check if payment failed"""
        return self.payment_status == 'failed'

    # Display methods
    def display_name(self) -> str:
        """Get display name for contributor (respects anonymity)"""
        if self.is_anonymous:
            return "Anonymous"
        return self.contributor_name or "Anonymous"

    # LNbits payment data getters
    def get_payment_hash(self) -> Optional[str]:
        """Get the payment hash for this contribution"""
        return self.lnbits_payment_hash

    def get_payment_request(self) -> Optional[str]:
        """Get the BOLT11 invoice string (payment request)"""
        return self.lnbits_payment_request
    
    def get_checking_id(self) -> Optional[str]:
        """Get the checking ID for polling payment status"""
        return self.lnbits_checking_id
    
    def get_reference(self) -> Optional[str]:
        """Get the internal reference for this contribution"""
        return self.lnbits_reference

    class Config:
        """Pydantic configuration"""
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
        validate_assignment = True