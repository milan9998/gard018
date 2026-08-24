-- Two legacy accounts existed in `users` before membership records were
-- created automatically. Add them to the admin member list without granting
-- a paid membership period and preserve their existing passwords.
INSERT INTO members (
  first_name,
  last_name,
  email,
  start_date,
  expiry_date,
  membership_type,
  status,
  membership_configured,
  qr_code_id
)
SELECT
  COALESCE(NULLIF(TRIM(u.first_name), ''), 'Korisnik'),
  COALESCE(NULLIF(TRIM(u.last_name), ''), 'Bez prezimena'),
  LOWER(u.email),
  (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Belgrade')::date,
  (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Belgrade')::date,
  'MANUAL',
  'active',
  FALSE,
  gen_random_uuid()
FROM users u
WHERE LOWER(u.email) IN ('kogoarts@gmail.com', 'cvoricdanijel@gmail.com')
  AND NOT EXISTS (
    SELECT 1
    FROM members m
    WHERE LOWER(m.email) = LOWER(u.email)
  );
