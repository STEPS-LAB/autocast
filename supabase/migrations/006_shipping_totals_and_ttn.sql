-- Add shipping totals and tracking (TTN) to orders.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS items_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ttn TEXT;

-- Keep existing total column for backward compatibility, but you may later
-- choose to make it a generated column or align it to grand_total.

CREATE INDEX IF NOT EXISTS idx_orders_ttn ON public.orders (ttn);
