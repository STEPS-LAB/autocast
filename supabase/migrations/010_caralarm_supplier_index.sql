-- Speed up loading Caralarm (and future supplier) products by JSONB supplier key.
CREATE INDEX IF NOT EXISTS idx_products_specs_supplier
  ON products ((specs->>'Постачальник'));
