-- Fix the RENTAL table auto-increment sequence
-- This resets the sequence to start after the highest existing RENTAL_ID

SELECT setval(
  pg_get_serial_sequence('"RENTAL"', 'RENTAL_ID'),
  COALESCE((SELECT MAX("RENTAL_ID") FROM "RENTAL"), 0) + 1,
  false
);
