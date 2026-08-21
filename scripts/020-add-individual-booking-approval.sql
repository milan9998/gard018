-- Individual training requests must be approved by an admin before confirmation.
ALTER TABLE individual_training_bookings
DROP CONSTRAINT IF EXISTS individual_training_bookings_status_check;

ALTER TABLE individual_training_bookings
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE individual_training_bookings
ADD CONSTRAINT individual_training_bookings_status_check
CHECK (status IN ('pending', 'booked', 'rejected', 'cancelled', 'attended', 'no_show'));

ALTER TABLE individual_training_bookings
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_individual_training_bookings_status
ON individual_training_bookings(status);
