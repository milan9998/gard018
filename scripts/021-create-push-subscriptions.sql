-- Web Push devices registered by signed-in members and admins.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  owner_email VARCHAR(255) NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_owner_email
ON push_subscriptions(LOWER(owner_email));

-- A single stable VAPID identity shared by every app instance. Environment
-- variables can override it, otherwise keys are generated on first use.
CREATE TABLE IF NOT EXISTS push_configuration (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
