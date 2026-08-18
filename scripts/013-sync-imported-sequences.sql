-- A data-only PostgreSQL import can leave SERIAL sequences behind the imported
-- primary keys. Align every application sequence with its current table.
SELECT setval(pg_get_serial_sequence('admins', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM admins;
SELECT setval(pg_get_serial_sequence('individual_training_bookings', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM individual_training_bookings;
SELECT setval(pg_get_serial_sequence('individual_training_slots', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM individual_training_slots;
SELECT setval(pg_get_serial_sequence('members', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM members;
SELECT setval(pg_get_serial_sequence('messages', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM messages;
SELECT setval(pg_get_serial_sequence('password_reset_tokens', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM password_reset_tokens;
DO $$
BEGIN
  IF to_regclass('public.playing_with_neon') IS NOT NULL THEN
    PERFORM setval(
      pg_get_serial_sequence('playing_with_neon', 'id'),
      COALESCE((SELECT MAX(id) FROM playing_with_neon), 1),
      EXISTS (SELECT 1 FROM playing_with_neon)
    );
  END IF;
END $$;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM users;
