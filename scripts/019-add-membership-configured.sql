-- A newly registered user is a club account, but does not yet have a paid
-- membership period. Keep the legacy expiry_date column for compatibility and
-- use this flag to distinguish "not configured" from a genuinely expired fee.
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS membership_configured BOOLEAN NOT NULL DEFAULT TRUE;

-- Older self-registrations were represented by expiry_date = start_date - 1.
-- Convert that sentinel to the explicit state so it is never shown as a real
-- expiry date and never receives an expiry notification.
UPDATE members
SET membership_configured = FALSE,
    expiry_date = start_date,
    status = 'active',
    updated_at = CURRENT_TIMESTAMP
WHERE membership_configured = TRUE
  AND expiry_date < start_date
  AND status = 'expired';

CREATE INDEX IF NOT EXISTS idx_membership_configured
  ON members(membership_configured);
