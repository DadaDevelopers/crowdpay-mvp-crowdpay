# CrowdPay

A Kenya-focused crowdfunding platform that bridges M-Pesa and Bitcoin/Lightning Network, enabling seamless fundraising with multiple payment options.

## Overview

CrowdPay allows users to create customizable fundraising campaigns that accept both local currency (KES via M-Pesa) and Bitcoin (Lightning & On-chain). Campaign creators receive instant Bitcoin settlement while contributors can pay using their preferred method.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Bitcoin**: Blink API (Lightning Network integration)

## Project Structure

```
src/
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
│   ├── ModeControl.tsx  # Campaign mode switcher
│   ├── PaymentModal.tsx # Universal payment modal (M-Pesa/Bitcoin)
│   ├── QRCodeDialog.tsx # QR code display for payments
│   ├── ShareButtons.tsx # Social sharing functionality
│   └── ...
├── contexts/
│   └── AuthContext.tsx  # Authentication state management
├── data/
│   └── demoData.ts      # Demo/sample data
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
├── App.tsx              # Main app with routing
├── App.css              # Global styles
├── index.css            # Tailwind base + design tokens
└── main.tsx             # App entry point

supabase/
├── config.toml          # Supabase configuration
└── functions/
    ├── create-blink-wallet/   # Edge function for wallet creation
    └── create-lightning-invoice/ # Edge function for invoices

public/
├── favicon.ico
├── robots.txt
└── placeholder.svg
```

## Database Schema

### Tables

- **campaigns**: Stores fundraising campaigns
  - `id`, `title`, `description`, `goal_amount`, `mode`, `category`
  - `slug` (custom URL), `cover_image_url`, `theme_color`
  - `is_public`, `end_date`, `user_id`

- **contributions**: Records all donations
  - `id`, `campaign_id`, `amount`, `contributor_name`
  - `payment_method`, `user_id`

- **profiles**: User profile information
  - `id`, `username`, `full_name`, `avatar_url`
  - `lightning_address`, `onchain_address`, `bitcoin_wallet_type`

## Key Features

### Campaign Modes
- **Mode A (Merchant/POS)**: Offline point-of-sale with real-time payment tracking
- **Mode B (Event/Social)**: Event invitations with ticket/potluck functionality
- **Mode C (Activism)**: Privacy-focused with anonymous donations

### Payment Options
- M-Pesa (KES) with automatic BTC conversion via Minmo
- Bitcoin Lightning Network (instant)
- Bitcoin On-chain

### Campaign Features
- Custom slugs (crowdpay.me/your-campaign)
- Cover images and theme colors
- Category filtering and search
- Progress tracking with real-time updates
- Social sharing with Open Graph meta tags

### User Features
- Dashboard with campaign overview
- Wallet management (Blink integration)
- Contribution history
- Notification system
- Profile customization

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

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd crowdpay

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Architecture Decisions

1. **Component-Based**: Small, focused components for reusability
2. **Design System First**: All styling through semantic tokens
3. **Type Safety**: Full TypeScript with auto-generated Supabase types
4. **Mobile-First**: Responsive design with mobile detection hooks
5. **SEO Optimized**: React Helmet for meta tags and Open Graph

## Contributing

1. Follow the existing code style and patterns
2. Use semantic color tokens, never direct colors
3. Keep components small and focused
4. Write TypeScript with proper types
5. Test on both light and dark themes

## License

MIT
