-- Migration 004: Migrate from LNbits to LNURL (non-custodial model)
-- This migration adds columns needed for LNURL-pay integration.
-- Old lnbits_* columns are kept for backward compatibility with existing data.
-- Idempotent: safe to run multiple times.

-- Users table: Add LNURL validation metadata
ALTER TABLE users ADD COLUMN IF NOT EXISTS lightning_address_valid BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS min_receivable_sats BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_receivable_sats BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lnurl_callback_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lightning_address_validated_at TIMESTAMPTZ;

-- Contributions table: Add LNURL-pay fields
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS invoice TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS payment_hash TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS confirmed_by TEXT;

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_contributions_payment_hash ON contributions (payment_hash);
CREATE INDEX IF NOT EXISTS idx_users_lightning_address ON users (lightning_address);
