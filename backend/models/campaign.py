from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator


class Campaign(BaseModel):
    """Campaign model for fundraising events"""
    
    id: Optional[str] = None
    creator_id: str = Field(..., min_length=3, max_length=50)
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0.0, ge=0)
    currency: str = Field(default="USD")
    creator_email: Optional[str] = None
    status: str = Field(default="active")
    is_public: bool = Field(default=True)
    story: Optional[str] = Field(None, max_length=10000)
    photos: Optional[List[str]] = Field(default_factory=list)  # Base64 or URLs
    end_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['active', 'completed', 'cancelled', 'expired']
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of {allowed_statuses}")
        return v
    
    @validator('currency')
    def validate_currency(cls, v):
        allowed_currencies = ['KSH', 'USD', 'BTC', 'SATS']
        if v not in allowed_currencies:
            raise ValueError(f"Currency must be one of {allowed_currencies}")
        return v
    
    @validator('current_amount')
    def validate_current_amount(cls, v, values):
        if v < 0:
            raise ValueError("Current amount cannot be negative")
        return v
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for database operations"""
        data = self.dict(exclude_none=True)
        
        # Convert datetime objects to ISO format strings
        if self.end_date:
            data['end_date'] = self.end_date.isoformat()
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        if self.updated_at:
            data['updated_at'] = self.updated_at.isoformat()
            
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Campaign':
        """Create Campaign instance from dictionary"""
        return cls(**data)
    
    def progress_percentage(self) -> float:
        """Calculate campaign progress percentage"""
        if self.target_amount <= 0:
            return 0.0
        return min((self.current_amount / self.target_amount) * 100, 100.0)
    
    def is_goal_reached(self) -> bool:
        """Check if campaign has reached its goal"""
        return self.current_amount >= self.target_amount
    
    def remaining_amount(self) -> float:
        """Calculate remaining amount to reach goal"""
        return max(self.target_amount - self.current_amount, 0.0)
    
    class Config:
        extra = "ignore"
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
