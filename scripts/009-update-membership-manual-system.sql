-- Migration to support manual membership management system
-- This removes the membership_type enum dependency and updates existing data

-- Update any existing NULL expiry dates to today (to be manually set by admin)
UPDATE members 
SET expiry_date = CURRENT_DATE 
WHERE expiry_date IS NULL;

-- The membership_type column can remain but is no longer used
-- Admin will manually set expiry_date instead of using duration presets

-- Ensure all future inserts work with the manual system
ALTER TABLE members 
ALTER COLUMN expiry_date SET NOT NULL;

-- Add comment to clarify the new manual system
COMMENT ON COLUMN members.expiry_date IS 'Manually set by admin - any future date allowed';
