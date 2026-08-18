-- Remove old check constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_membership_type_check;

-- Add new constraint that allows MANUAL and old values
ALTER TABLE members 
ADD CONSTRAINT members_membership_type_check 
CHECK (membership_type IN ('1_MONTH', '3_MONTHS', '1_YEAR', 'MANUAL'));

-- Update default value to MANUAL for future entries
ALTER TABLE members ALTER COLUMN membership_type SET DEFAULT 'MANUAL';
