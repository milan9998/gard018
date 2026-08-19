-- Separate validity period for paid individual training.
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS individual_start_date DATE,
  ADD COLUMN IF NOT EXISTS individual_expiry_date DATE;

CREATE INDEX IF NOT EXISTS idx_members_individual_expiry_date
  ON members(individual_expiry_date);

COMMENT ON COLUMN members.individual_start_date IS 'Start date of the currently paid individual-training period.';
COMMENT ON COLUMN members.individual_expiry_date IS 'Last day on which the member may book individual training.';
