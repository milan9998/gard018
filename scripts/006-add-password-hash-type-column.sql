-- Migration: Add password hash type tracking for gradual SHA-256 to bcrypt migration
-- This allows existing users to continue logging in while new users get bcrypt security

-- Add column to track password hash type (sha256 or bcrypt)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash_type VARCHAR(20) DEFAULT 'sha256';

-- Mark all existing users as using SHA-256 (legacy)
UPDATE users 
SET password_hash_type = 'sha256' 
WHERE password_hash_type IS NULL OR password_hash_type = 'sha256';

-- Create index for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_users_password_hash_type 
ON users(password_hash_type);

-- Add comment for documentation
COMMENT ON COLUMN users.password_hash_type IS 'Tracks password hashing algorithm: sha256 (legacy) or bcrypt (current). Users are automatically migrated to bcrypt on next successful login.';
