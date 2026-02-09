-- Migration: Add missing fields to contributions table
-- Run this in Supabase SQL Editor

-- Add invoice expiry tracking
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS invoice_expires_at TIMESTAMP WITH TIME ZONE;

-- Add updated_at column
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for finding expired invoices
CREATE INDEX IF NOT EXISTS idx_contributions_invoice_expires_at
    ON contributions(invoice_expires_at)
    WHERE payment_status = 'pending';
