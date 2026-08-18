-- Add membership_type column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS membership_type VARCHAR(20) DEFAULT '1_MONTH' 
CHECK (membership_type IN ('1_MONTH', '3_MONTHS', '1_YEAR'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_members_membership_type ON members(membership_type);

-- Update existing members to have default 1_MONTH type
UPDATE members 
SET membership_type = '1_MONTH' 
WHERE membership_type IS NULL;
