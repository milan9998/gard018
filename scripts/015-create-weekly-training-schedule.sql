CREATE TABLE IF NOT EXISTS weekly_training_schedule (
  id SERIAL PRIMARY KEY,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  program VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS weekly_training_schedule_sort_idx
  ON weekly_training_schedule (day_of_week, start_time);

INSERT INTO weekly_training_schedule (day_of_week, start_time, end_time, program, created_by)
SELECT seed.day_of_week, seed.start_time::time, seed.end_time::time, seed.program, 'local-migration'
FROM (VALUES
  (1, '20:00', '21:00', 'Boks, Kik Boks, Muay Thai'),
  (2, '20:00', '21:00', 'Boks, Kik Boks, Muay Thai'),
  (4, '20:00', '21:00', 'Boks, Kik Boks, Muay Thai'),
  (5, '20:00', '21:00', 'Boks, Kik Boks, Muay Thai')
) AS seed(day_of_week, start_time, end_time, program)
WHERE NOT EXISTS (SELECT 1 FROM weekly_training_schedule);
