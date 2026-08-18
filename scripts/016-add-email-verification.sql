ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash VARCHAR(64),
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP;

-- Svi postojeći i administratorski nalozi ostaju aktivni. Samo novi nalozi
-- kreirani javnom registracijom počinju kao nepotvrđeni.
UPDATE users
SET email_verified_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE email_verified_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_verification_token_hash
  ON users(email_verification_token_hash)
  WHERE email_verification_token_hash IS NOT NULL;
