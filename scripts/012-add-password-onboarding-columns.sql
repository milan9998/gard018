-- Track accounts that must replace an admin-provided temporary password.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_must_change_password
ON users(must_change_password);

COMMENT ON COLUMN users.must_change_password IS 'Forces a password change after the first login with a temporary password.';
