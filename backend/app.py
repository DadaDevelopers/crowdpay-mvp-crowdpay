from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
from config import Config
from routes import campaigns_bp, contributions_bp, auth_bp, payments_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Application factory"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    try:
        Config.validate()
        logger.info("Configuration validated successfully")
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise

    # Enable CORS with proper configuration
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/api/*": {
                "origins": Config.CORS_ORIGINS
            }
        },
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )
    
        # Explicit OPTIONS handling (keeps browsers calm)
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return "", 200


    # Register blueprints
    app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')
    app.register_blueprint(contributions_bp, url_prefix='/api/contributions')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'CrowdPay API',
            'version': '2.0.0',
            'payment_provider': 'LNbits'
        }), 200

    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Welcome to CrowdPay API',
            'version': '2.0.0',
            'payment_provider': 'LNbits (Lightning Network)',
            'endpoints': {
                'campaigns': '/api/campaigns',
                'contributions': '/api/contributions',
                'invoice_create': '/api/invoice/create',
                'invoice_status': '/api/invoice/status/<payment_hash>',
                'wallet_balance': '/api/wallet/balance',
                'webhook': '/api/webhooks/lnbits',
                'health': '/health'
            }
        }), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {str(error)}")
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        logger.error(f"Unhandled exception: {str(error)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

    logger.info("CrowdPay API initialized successfully with LNbits integration")

    return app

# Create app instance for module-level import (e.g., `from app import app`)
# This allows both direct import and factory pattern usage
app = create_app()

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=Config.DEBUG
    )
