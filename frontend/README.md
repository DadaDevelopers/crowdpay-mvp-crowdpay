# CrowdPay

A Kenya-focused crowdfunding platform that bridges M-Pesa and Bitcoin/Lightning Network, enabling seamless fundraising with multiple payment options.

## Overview

CrowdPay allows users to create customizable fundraising events that accept both local currency (KES via M-Pesa) and Bitcoin (Lightning & On-chain). Event creators receive instant Bitcoin settlement while contributors can pay using their preferred method.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Backend**: Flask Python (REST API)
- **Payments**: LNbits (Lightning Network integration)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth via backend endpoints

## Project Structure

```
frontend/src/
├── assets/              # Static assets (logo, images)
├── components/
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── AddContributionDialog.tsx
│   ├── AppLayout.tsx    # Main layout wrapper with sidebar
│   ├── AppSidebar.tsx   # Navigation sidebar
│   ├── LightningPaymentModal.tsx  # Lightning-specific payment modal
│   ├── ModeControl.tsx  # Campaign mode switcher
│   ├── PaymentModal.tsx # Universal payment modal (M-Pesa/Bitcoin)
│   ├── QRCodeDialog.tsx # QR code display for payments
│   ├── ShareButtons.tsx # Social sharing functionality
│   └── ...
├── contexts/
│   ├── AuthContext.tsx       # Authentication type definitions
│   ├── CampaignsContext.tsx  # Campaign data via React Query + backend API
│   └── MockAuthContext.tsx   # Auth context calling backend auth endpoints
├── hooks/
│   ├── use-mobile.tsx   # Mobile detection hook
│   ├── use-toast.ts     # Toast notifications hook
│   └── useCampaignContributions.tsx
├── integrations/
│   └── supabase/
│       ├── client.ts    # Supabase client configuration
│       └── types.ts     # Auto-generated database types
├── lib/
│   └── utils.ts         # Utility functions (cn, etc.)
├── pages/
│   ├── Auth.tsx         # Sign in/Sign up page
│   ├── Campaign.tsx     # Individual campaign view
│   ├── Contributions.tsx # User's contribution history
│   ├── CreateCampaign.tsx # Campaign creation form
│   ├── Dashboard.tsx    # User dashboard
│   ├── ExploreCampaigns.tsx # Public campaign gallery
│   ├── Landing.tsx      # Public landing page
│   ├── MyLinks.tsx      # User's created campaigns
│   ├── Notifications.tsx # Contribution alerts
│   ├── ProfileSettings.tsx # User profile settings
│   ├── Support.tsx      # Help & support page
│   └── Wallet.tsx       # Bitcoin wallet management
├── services/
│   └── api.ts           # Central API service (campaigns, contributions, invoices, wallet)
├── App.tsx              # Main app with routing
├── App.css              # Global styles
├── index.css            # Tailwind base + design tokens
└── main.tsx             # App entry point

backend/
├── app.py               # Flask application entry point
├── config.py            # Configuration management
├── requirements.txt     # Python dependencies
├── models/              # Pydantic data models
├── routes/              # API route blueprints (campaigns, contributions, payments, auth)
├── services/            # Business logic (LNbits, polling, Supabase, auth)
├── migrations/          # Database migration scripts
├── supabase_setup.sql   # Database schema
└── supabase_rls.sql     # Row Level Security policies

public/
├── favicon.ico
├── robots.txt
└── placeholder.svg
```

## Key Features

### Campaign Modes
- **Mode A (Merchant/POS)**: Offline point-of-sale with real-time payment tracking
- **Mode B (Event/Social)**: Event invitations with ticket/potluck functionality
- **Mode C (Activism)**: Privacy-focused with anonymous donations

### Payment Options
- M-Pesa (KES) with automatic BTC conversion
- Bitcoin Lightning Network (instant) via LNbits
- Bitcoin On-chain

### Event Features
- Custom slugs (crowdpay.me/your-campaign)
- Cover images and theme colors
- Category filtering and search
- Progress tracking with real-time updates
- Social sharing with Open Graph meta tags

### User Features
- Dashboard with campaign overview
- Wallet management
- Contribution history
- Notification system
- Profile customization

## API Integration

The frontend communicates with the Flask backend through a central API service (`src/services/api.ts`):

- **`campaignApi`** - CRUD operations for campaigns (`/api/campaigns`)
- **`contributionApi`** - Create contributions and poll payment status (`/api/contributions`)
- **`invoiceApi`** - Create and check Lightning invoices (`/api/invoice`)
- **`walletApi`** - Wallet balance and payment history (`/api/wallet`)

### Payment Flow

1. User opens a campaign page (`/c/:id`)
2. Clicks "Contribute with Lightning"
3. `PaymentModal` creates a contribution via `POST /api/contributions`
4. Backend generates an LNbits Lightning invoice and starts server-side polling
5. Frontend displays a QR code with the BOLT11 invoice
6. Frontend polls `GET /api/contributions/<id>/status` for payment confirmation
7. On payment confirmation, backend updates the campaign's `current_amount`

## Design System

The app uses a consistent design system defined in:
- `src/index.css` - CSS custom properties (HSL colors, gradients, shadows)
- `tailwind.config.ts` - Tailwind configuration with semantic tokens

### Color Palette
- **Primary**: Bitcoin Orange (`#F7931A`)
- **Secondary**: M-Pesa Green (`#4CAF50`)
- **Semantic tokens**: `--background`, `--foreground`, `--primary`, `--muted`, etc.

### Themes
- Light and dark mode support via `next-themes`
- All colors use HSL format for consistency

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- Python 3.9+ (for backend)
- LNbits wallet (demo.lnbits.com for testing)
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/DadaDevelopers/crowdpay-mvp-crowdpay
cd crowdpay-mvp-crowdpay

# --- Backend setup ---
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Fill in Supabase & LNbits credentials
python app.py             # Runs on http://localhost:5000

# --- Frontend setup ---
cd ../frontend
npm install
cp .env.example .env      # Set VITE_API_URL=http://localhost:5000
npm run dev               # Runs on http://localhost:5173
```

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Architecture Decisions

1. **Backend-First Data**: All data fetched from Flask API, no mock/demo data in frontend
2. **React Query**: Server state managed via TanStack Query for caching, refetching, and optimistic updates
3. **LNbits over Bitnob**: Self-hosted Lightning payment processing for better control and lower fees
4. **Component-Based**: Small, focused components for reusability
5. **Design System First**: All styling through semantic tokens
6. **Type Safety**: Full TypeScript with auto-generated Supabase types
7. **Mobile-First**: Responsive design with mobile detection hooks

## Contributing

1. Follow the existing code style and patterns
2. Use semantic color tokens, never direct colors
3. Keep components small and focused
4. Write TypeScript with proper types
5. Test on both light and dark themes

## License

MIT
