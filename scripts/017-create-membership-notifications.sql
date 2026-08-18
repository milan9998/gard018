CREATE TABLE IF NOT EXISTS membership_notifications (
  id BIGSERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('warning', 'expiry')),
  membership_expiry DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (member_id, notification_type, membership_expiry)
);

CREATE INDEX IF NOT EXISTS idx_membership_notifications_member_id
  ON membership_notifications(member_id);

CREATE INDEX IF NOT EXISTS idx_membership_notifications_sent_at
  ON membership_notifications(sent_at DESC);

