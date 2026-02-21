-- CrowdPay Database Setup for Supabase
-- Payment Provider: LNbits (Lightning Network)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    story TEXT,                                   -- Long-form campaign story
    photos JSONB DEFAULT '[]'::jsonb,             -- Array of image data URLs / public URLs
    target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'SATS',
    creator_id VARCHAR(255) NOT NULL,
    creator_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,          -- If false, hidden from public Explore page
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Run these on existing databases to add the new columns:
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS story TEXT;
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

-- Contributions Table
-- Stores Lightning payment details from LNbits
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contributor_name VARCHAR(100),
    contributor_email VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'SATS',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),

    -- LNbits payment fields (primary)
    lnbits_payment_hash VARCHAR(255),
    lnbits_payment_request TEXT,
    lnbits_checking_id VARCHAR(255),

    -- Legacy fields for backward compatibility (will be deprecated)
    bitnob_payment_id VARCHAR(255),
    bitnob_payment_request TEXT,
    bitnob_payment_hash VARCHAR(255),
    bitnob_reference VARCHAR(255),

    -- Transaction details
    transaction_id VARCHAR(255),  -- Payment preimage (proof of payment)
    message TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_campaign_id ON contributions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contributions_payment_status ON contributions(payment_status);
CREATE INDEX IF NOT EXISTS idx_contributions_lnbits_payment_hash ON contributions(lnbits_payment_hash);
CREATE INDEX IF NOT EXISTS idx_contributions_lnbits_checking_id ON contributions(lnbits_checking_id);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at DESC);

-- Legacy indexes (for backward compatibility during migration)
CREATE INDEX IF NOT EXISTS idx_contributions_bitnob_payment_id ON contributions(bitnob_payment_id);
CREATE INDEX IF NOT EXISTS idx_contributions_bitnob_reference ON contributions(bitnob_reference);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check if campaign goal is reached and update status
CREATE OR REPLACE FUNCTION check_campaign_goal()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_amount >= (SELECT target_amount FROM campaigns WHERE id = NEW.id) THEN
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update campaign status when goal is reached
CREATE TRIGGER update_campaign_status_on_goal
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    WHEN (OLD.current_amount < NEW.current_amount)
    EXECUTE FUNCTION check_campaign_goal();

-- Comments for documentation
COMMENT ON TABLE campaigns IS 'Stores fundraising campaign information';
COMMENT ON TABLE contributions IS 'Stores individual contributions to campaigns via Lightning Network';

COMMENT ON COLUMN campaigns.target_amount IS 'Fundraising goal amount in satoshis';
COMMENT ON COLUMN campaigns.current_amount IS 'Current amount raised in satoshis';
COMMENT ON COLUMN campaigns.currency IS 'Currency: SATS (default) or BTC';
COMMENT ON COLUMN campaigns.status IS 'Campaign status: active, completed, cancelled, or expired';

COMMENT ON COLUMN contributions.payment_status IS 'Payment status: pending, paid, failed, expired, or cancelled';
COMMENT ON COLUMN contributions.lnbits_payment_hash IS 'LNbits payment hash - unique identifier for Lightning payment';
COMMENT ON COLUMN contributions.lnbits_payment_request IS 'BOLT11 Lightning invoice string for QR code display';
COMMENT ON COLUMN contributions.lnbits_checking_id IS 'LNbits checking ID for payment status polling';
COMMENT ON COLUMN contributions.transaction_id IS 'Payment preimage - cryptographic proof of payment';
COMMENT ON COLUMN contributions.is_anonymous IS 'Whether the contribution should be displayed anonymously';
