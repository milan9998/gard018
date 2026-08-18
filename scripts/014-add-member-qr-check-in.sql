ALTER TABLE members
ADD COLUMN IF NOT EXISTS qr_code_id UUID;

UPDATE members
SET qr_code_id = gen_random_uuid()
WHERE qr_code_id IS NULL;

ALTER TABLE members
ALTER COLUMN qr_code_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_qr_code_id
ON members(qr_code_id);

CREATE TABLE IF NOT EXISTS training_check_ins (
  id BIGSERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  scanned_by VARCHAR(255) NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  allowed BOOLEAN NOT NULL,
  result VARCHAR(30) NOT NULL CHECK (result IN ('active', 'expired')),
  membership_expiry DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_training_check_ins_member_id
ON training_check_ins(member_id);

CREATE INDEX IF NOT EXISTS idx_training_check_ins_scanned_at
ON training_check_ins(scanned_at DESC);
