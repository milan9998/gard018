-- Individual training payments, slots, and bookings
ALTER TABLE members
ADD COLUMN IF NOT EXISTS individual_training_paid BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_members_individual_training_paid
ON members(individual_training_paid);

CREATE TABLE IF NOT EXISTS individual_training_slots (
  id SERIAL PRIMARY KEY,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'cancelled', 'completed')),
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_individual_training_slots_starts_at
ON individual_training_slots(starts_at);

CREATE TABLE IF NOT EXISTS individual_training_bookings (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL REFERENCES individual_training_slots(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'attended', 'no_show')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slot_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_individual_training_bookings_slot_id
ON individual_training_bookings(slot_id);

CREATE INDEX IF NOT EXISTS idx_individual_training_bookings_member_id
ON individual_training_bookings(member_id);
