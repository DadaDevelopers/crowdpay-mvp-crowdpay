from flask import Blueprint

# Create blueprints
campaigns_bp = Blueprint('campaigns', __name__, url_prefix='/api/campaigns')
contributions_bp = Blueprint('contributions', __name__, url_prefix='/api/contributions')
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
lnurl_bp = Blueprint('lnurl', __name__, url_prefix='/api/lnurl')

# Import routes to register them
from . import campaigns, contributions, auth, lnurl


__all__ = ['campaigns_bp', 'contributions_bp', 'auth_bp', 'lnurl_bp']
