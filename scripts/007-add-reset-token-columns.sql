-- Dodavanje kolona za reset token u users tabelu
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Index za brže pretraživanje po tokenu
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
