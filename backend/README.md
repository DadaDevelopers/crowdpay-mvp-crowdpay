# CrowdPay MVP Backend

A Flask-based backend service for crowdfunding campaigns with LNbits integration for Bitcoin Lightning Network payments.

## Features

- **Campaign Management**: Create, update, and track fundraising campaigns
- **Contribution Tracking**: Accept and monitor contributions with real-time status updates
- **Lightning Payments**: Integration with LNbits for Bitcoin Lightning Network payments
- **Invoice Polling**: Automatic polling service to track payment confirmations
- **Webhook Support**: Real-time payment notifications via LNbits webhooks
- **Database**: Supabase PostgreSQL backend with Row Level Security
- **RESTful API**: Well-structured API endpoints with proper error handling

## Technology Stack

- **Framework**: Flask 3.0
- **Database**: Supabase (PostgreSQL)
- **Payment Gateway**: LNbits (Lightning Network)
- **Validation**: Pydantic models
- **Testing**: Pytest
- **Production Server**: Gunicorn

## Project Structure

```
backend/
├── app.py                      # Application entry point
├── config.py                   # Configuration management
├── requirements.txt            # Python dependencies
├── models/
│   ├── __init__.py
│   ├── campaign.py            # Campaign data model
│   └── contribution.py        # Contribution data model
├── routes/
│   ├── __init__.py
│   ├── campaigns.py           # Campaign endpoints
│   ├── contributions.py       # Contribution endpoints
│   ├── payments.py            # Invoice/wallet endpoints
│   └── auth.py                # Authentication endpoints
├── services/
│   ├── __init__.py
│   ├── lnbits.py              # LNbits API integration
│   ├── invoice_polling.py     # Payment polling service
│   ├── auth.py                # Authentication service
│   └── supabase_client.py     # Database client
├── migrations/
│   └── 001_rename_bitnob_to_lnbits.sql  # DB migration
├── supabase_setup.sql         # Database schema
└── supabase_rls.sql           # Row Level Security policies
```

## Setup

### Prerequisites

- Python 3.9+
- Supabase account
- LNbits wallet (demo.lnbits.com for testing)

### Installation

1. **Clone and navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in the values:
   ```env
   # Flask Configuration
   SECRET_KEY=your-secret-key-here
   FLASK_DEBUG=True

   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key

   # LNbits Configuration
   LNBITS_URL=https://demo.lnbits.com
   LNBITS_WALLET_ID=your-wallet-id
   LNBITS_ADMIN_KEY=your-admin-key
   LNBITS_INVOICE_KEY=your-invoice-key
   LNBITS_WEBHOOK_URL=https://your-backend.com/api/webhooks/lnbits

   # Platform Fee (percentage)
   PLATFORM_FEE_PERCENT=2.5

   # Polling Configuration
   POLLING_INTERVAL=30
   POLLING_TIMEOUT=3600

   # CORS
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

5. **Set up database**

   Run the SQL scripts in your Supabase SQL editor:
   ```bash
   # First run supabase_setup.sql
   # Then run supabase_rls.sql
   ```

## Running the Application

### Development Mode

```bash
python app.py
```

The API will be available at `http://localhost:5000`

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

## API Endpoints

### Health Check
- `GET /health` - Check API health status

### Campaigns
- `POST /api/campaigns` - Create a new campaign
- `GET /api/campaigns` - List all campaigns (with filters)
- `GET /api/campaigns/<id>` - Get campaign details
- `PUT /api/campaigns/<id>` - Update campaign
- `DELETE /api/campaigns/<id>` - Cancel campaign
- `GET /api/campaigns/<id>/contributions` - Get campaign contributions

### Contributions
- `POST /api/contributions` - Create contribution with Lightning invoice
- `GET /api/contributions` - List contributions (with filters)
- `GET /api/contributions/<id>` - Get contribution details
- `GET /api/contributions/<id>/status` - Check payment status
- `POST /api/contributions/<id>/cancel` - Cancel pending contribution
- `POST /api/contributions/webhook` - LNbits webhook endpoint

### Invoices & Wallet
- `POST /api/invoice/create` - Create standalone Lightning invoice
- `GET /api/invoice/status/<payment_hash>` - Check invoice status
- `POST /api/invoice/decode` - Decode BOLT11 invoice
- `GET /api/wallet/balance` - Get wallet balance (auth required)
- `GET /api/wallet/payments` - Get recent payments (auth required)
- `POST /api/webhooks/lnbits` - LNbits webhook endpoint

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY` | Flask secret key | - | Yes |
| `FLASK_DEBUG` | Enable debug mode | False | No |
| `SUPABASE_URL` | Supabase project URL | - | Yes |
| `SUPABASE_KEY` | Supabase anon key | - | Yes |
| `LNBITS_URL` | LNbits instance URL | https://demo.lnbits.com | No |
| `LNBITS_WALLET_ID` | LNbits wallet ID | - | Yes |
| `LNBITS_ADMIN_KEY` | LNbits admin key | - | Yes |
| `LNBITS_INVOICE_KEY` | LNbits invoice/read key | - | Yes |
| `LNBITS_WEBHOOK_URL` | Webhook URL for notifications | - | No |
| `PLATFORM_FEE_PERCENT` | Platform fee percentage | 2.5 | No |
| `POLLING_INTERVAL` | Invoice polling interval (seconds) | 30 | No |
| `POLLING_TIMEOUT` | Invoice polling timeout (seconds) | 3600 | No |
| `CORS_ORIGINS` | Allowed CORS origins | * | No |

## LNbits API Keys

LNbits uses two types of API keys:

- **Admin Key**: Full access - can create invoices, pay invoices, get balance
- **Invoice Key**: Limited access - can only create invoices and check status

For security, the backend uses:
- Invoice Key for creating and checking invoices (safer)
- Admin Key only for paying invoices (if needed for payouts)

## Payment Flow

```
1. User initiates contribution
   └── POST /api/contributions

2. Backend creates LNbits invoice
   └── LNbits POST /api/v1/payments

3. Frontend displays QR code
   └── BOLT11 invoice string

4. User pays with Lightning wallet
   └── Any Lightning-compatible wallet

5. Payment confirmation (two paths)
   ├── Path A: Polling service detects payment
   │   └── GET /api/v1/payments/{payment_hash}
   └── Path B: LNbits webhook notification
       └── POST /api/webhooks/lnbits

6. Backend updates database
   ├── Contribution status → "paid"
   ├── Campaign amount incremented
   └── Platform fee calculated
```

## Platform Fee Logic

When a payment is confirmed:
1. Full payment amount is recorded
2. Platform fee is calculated (default 2.5%)
3. Creator amount = Payment - Platform fee
4. Campaign `current_amount` is incremented by creator amount

## Security

- Row Level Security (RLS) enabled on all tables
- API key authentication for LNbits integration
- Webhook signature verification (optional)
- CORS configuration for frontend integration
- Input validation using Pydantic models
- Admin keys never exposed to frontend

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message description",
  "details": {} // Optional additional details
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Adding New Endpoints

1. Define route in appropriate blueprint
2. Add validation using Pydantic models
3. Implement business logic
4. Add proper error handling
5. Write tests

### Database Migrations

When modifying the schema:
1. Update `supabase_setup.sql`
2. Create migration script in `migrations/`
3. Update model classes in `models/`
4. Test locally
5. Apply changes to Supabase

## Troubleshooting

### Common Issues

**Issue**: `Configuration error: Missing required configuration`
- **Solution**: Ensure all required environment variables are set in `.env`

**Issue**: `Failed to create invoice`
- **Solution**: Verify LNbits API credentials and check wallet balance

**Issue**: `LNbits connection failed`
- **Solution**: Check LNBITS_URL and ensure the instance is accessible

**Issue**: Polling not working
- **Solution**: Check POLLING_INTERVAL and ensure background threads are enabled

## License

MIT License

## Support

For issues and questions:
- Check API documentation in `API.md`
- Review test files for usage examples
- Open an issue on the repository
