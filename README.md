# CrowdPay

A Kenya-focused crowdfunding platform that bridges M-Pesa and Bitcoin Lightning Network, enabling seamless fundraising with multiple payment options.

## Overview

CrowdPay allows users to create customizable fundraising campaigns that accept both local currency (KES via M-Pesa) and Bitcoin (Lightning Network). Campaign creators receive instant Bitcoin settlement while contributors can pay using their preferred method.

## Architecture

```
┌─────────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│   React Frontend    │──────▶│   Flask Backend      │──────▶│   LNbits     │
│   (Vite + TS)       │  API  │   (REST API)         │       │  (Lightning) │
└─────────────────────┘       └─────────────────────┘       └──────────────┘
                                       │
                                       ▼
                              ┌─────────────────────┐
                              │   Supabase           │
                              │   (PostgreSQL + Auth)│
                              └─────────────────────┘
```

### Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Frontend     | React 18, TypeScript, Vite, Tailwind CSS    |
| UI Library   | shadcn/ui, Framer Motion                    |
| State        | TanStack React Query                        |
| Routing      | React Router v6                             |
| Backend      | Flask 3.0, Python 3.9+                      |
| Database     | Supabase (PostgreSQL) with Row Level Security|
| Auth         | Supabase Auth (JWT tokens via backend)      |
| Payments     | LNbits (Bitcoin Lightning Network)          |
| Validation   | Pydantic models                             |

## Project Structure

```
crowdpay-mvp-crowdpay/
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/         # UI components (shadcn/ui, payment modals)
│   │   ├── contexts/           # Auth + campaign data contexts
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Route pages (Dashboard, Campaign, etc.)
│   │   ├── services/
│   │   │   └── api.ts          # Central API service
│   │   └── App.tsx             # Main app with routing
│   ├── .env.example
│   ├── package.json
│   └── README.md               # Frontend-specific docs
│
├── backend/                    # Flask backend API
│   ├── routes/                 # API blueprints (auth, campaigns, contributions, payments)
│   ├── services/               # Business logic (LNbits, polling, Supabase)
│   ├── models/                 # Pydantic data models
│   ├── migrations/             # SQL migration scripts
│   ├── app.py                  # Flask app factory
│   ├── config.py               # Environment configuration
│   ├── supabase_setup.sql      # Database schema
│   ├── supabase_rls.sql        # Row Level Security policies
│   ├── .env.example
│   ├── requirements.txt
│   ├── API.md                  # Full API documentation
│   └── README.md               # Backend-specific docs
│
└── README.md                   # This file
```

## Features

### Campaigns
- Create, edit, and manage fundraising campaigns
- Three campaign modes: Merchant/POS, Event/Social, Activism
- Category filtering and search
- Progress tracking with real-time updates
- Custom slugs and shareable links

### Payments
- Bitcoin Lightning Network payments via LNbits
- QR code generation for BOLT11 invoices
- Server-side invoice polling for payment confirmation
- LNbits webhook support for real-time notifications
- Platform fee calculation (configurable, default 2.5%)

### Authentication
- User registration with username, email, and password
- Sign in/sign out with JWT tokens via Supabase Auth
- Token refresh support
- Protected API endpoints

### User Features
- Dashboard with campaign overview and stats
- Contribution history
- Wallet balance and payment history
- Notification system

## Payment Flow

```
1. Contributor opens campaign page
2. Clicks "Contribute with Lightning"
3. Frontend sends POST /api/contributions with amount
4. Backend creates LNbits Lightning invoice + starts polling
5. Frontend displays QR code (BOLT11 invoice)
6. Contributor pays with any Lightning wallet
7. Payment confirmed via polling or LNbits webhook
8. Backend updates contribution status + campaign total
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint               | Description                  |
|--------|------------------------|------------------------------|
| POST   | `/api/auth/signup`     | Register new user            |
| POST   | `/api/auth/signin`     | Sign in                      |
| POST   | `/api/auth/signout`    | Sign out                     |
| GET    | `/api/auth/me`         | Get current user             |
| POST   | `/api/auth/refresh`    | Refresh access token         |

### Campaigns (`/api/campaigns`)
| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| POST   | `/api/campaigns`                      | Create campaign              |
| GET    | `/api/campaigns`                      | List campaigns (with filters)|
| GET    | `/api/campaigns/<id>`                 | Get campaign details         |
| PUT    | `/api/campaigns/<id>`                 | Update campaign              |
| DELETE | `/api/campaigns/<id>`                 | Cancel campaign              |
| GET    | `/api/campaigns/<id>/contributions`   | Get campaign contributions   |

### Contributions (`/api/contributions`)
| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| POST   | `/api/contributions`                  | Create contribution + invoice|
| GET    | `/api/contributions`                  | List contributions           |
| GET    | `/api/contributions/<id>`             | Get contribution details     |
| GET    | `/api/contributions/<id>/status`      | Poll payment status          |
| POST   | `/api/contributions/<id>/cancel`      | Cancel contribution          |

### Invoices & Wallet (`/api`)
| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| POST   | `/api/invoice/create`                 | Create standalone invoice    |
| GET    | `/api/invoice/status/<payment_hash>`  | Check invoice status         |
| POST   | `/api/invoice/decode`                 | Decode BOLT11 invoice        |
| GET    | `/api/wallet/balance`                 | Get wallet balance           |
| GET    | `/api/wallet/payments`                | Get recent payments          |
| POST   | `/api/webhooks/lnbits`                | LNbits payment webhook       |

For full request/response documentation, see [`backend/API.md`](backend/API.md).

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Supabase** account ([supabase.com](https://supabase.com))
- **LNbits** wallet ([demo.lnbits.com](https://demo.lnbits.com) for testing)

### 1. Clone the repository

```bash
git clone https://github.com/DadaDevelopers/crowdpay-mvp-crowdpay
cd crowdpay-mvp-crowdpay
```

### 2. Set up the database

Run the following SQL scripts in your Supabase SQL editor:
1. `backend/supabase_setup.sql` - creates tables and schema
2. `backend/supabase_rls.sql` - sets up Row Level Security policies

### 3. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # Fill in your Supabase + LNbits credentials
python app.py               # Runs on http://localhost:5000
```

### 4. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env        # Set VITE_API_URL=http://localhost:5000
npm run dev                 # Runs on http://localhost:5173
```

### Environment Variables

**Backend** (`backend/.env`):
| Variable              | Description                          | Required |
|-----------------------|--------------------------------------|----------|
| `SECRET_KEY`          | Flask secret key                     | Yes      |
| `SUPABASE_URL`        | Supabase project URL                 | Yes      |
| `SUPABASE_KEY`        | Supabase anon key                    | Yes      |
| `LNBITS_URL`          | LNbits instance URL                  | Yes      |
| `LNBITS_INVOICE_KEY`  | LNbits invoice/read key              | Yes      |
| `LNBITS_ADMIN_KEY`    | LNbits admin key (for payouts)       | No       |
| `LNBITS_WALLET_ID`    | LNbits wallet ID                     | No       |
| `LNBITS_WEBHOOK_URL`  | Webhook URL for payment notifications| No       |
| `PLATFORM_FEE_PERCENT`| Platform fee percentage (default 2.5)| No       |
| `CORS_ORIGINS`        | Allowed CORS origins (comma-separated)| No      |

**Frontend** (`frontend/.env`):
| Variable                        | Description              | Required |
|---------------------------------|--------------------------|----------|
| `VITE_API_URL`                  | Backend API URL          | Yes      |
| `VITE_SUPABASE_URL`             | Supabase project URL     | Yes      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key        | Yes      |

## Development

### Frontend scripts

```bash
cd frontend
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend

```bash
cd backend
python app.py                                    # Development server
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"  # Production server
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Follow existing code patterns and style
4. Use semantic color tokens in the frontend (never direct colors)
5. Write TypeScript with proper types
6. Add Pydantic validation for new backend endpoints
7. Test on both light and dark themes
8. Submit a pull request

## License

MIT
