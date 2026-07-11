ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT NOT NULL DEFAULT 'UAH'
  CHECK (preferred_currency IN ('UAH', 'USD'));
