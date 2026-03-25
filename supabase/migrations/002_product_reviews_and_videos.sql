-- Add product videos + reviews

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS product_reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_created
  ON product_reviews(product_id, created_at DESC);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY IF NOT EXISTS "Public read product reviews"
  ON product_reviews FOR SELECT TO anon, authenticated
  USING (TRUE);

-- Authenticated write (own)
CREATE POLICY IF NOT EXISTS "Users insert own product reviews"
  ON product_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users update own product reviews"
  ON product_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users delete own product reviews"
  ON product_reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

