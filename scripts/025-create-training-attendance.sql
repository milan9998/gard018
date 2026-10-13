-- Count confirmed training visits from this migration onward. Older QR scan
-- checks are intentionally not imported because a scan was not always a visit.
CREATE TABLE IF NOT EXISTS training_attendances (
  id BIGSERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attended_on DATE NOT NULL,
  was_overdue BOOLEAN NOT NULL,
  source_check_in_id BIGINT UNIQUE REFERENCES training_check_ins(id) ON DELETE SET NULL,
  approved_by VARCHAR(255) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMPTZ,
  CONSTRAINT training_attendances_one_per_day UNIQUE (member_id, attended_on),
  CONSTRAINT training_attendances_settlement CHECK (was_overdue OR settled_at IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_training_attendances_member_month
ON training_attendances(member_id, attended_on DESC);

CREATE INDEX IF NOT EXISTS idx_training_attendances_pending_overdue
ON training_attendances(member_id, attended_on)
WHERE was_overdue AND settled_at IS NULL;
