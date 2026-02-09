-- Migration: Add profile fields to users table
-- Run this in Supabase SQL Editor

-- Add profile columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS lightning_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onchain_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(20) DEFAULT 'internal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for lightning address lookups
CREATE INDEX IF NOT EXISTS idx_users_lightning_address ON users(lightning_address);

-- Add updated_at trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
