-- Harden RLS for orders and order_items:
-- Allow anonymous users to create guest orders, but do NOT allow public reading of guest orders.

-- Orders: remove anon read
DROP POLICY IF EXISTS "Orders: read anon" ON orders;

-- Order items: remove anon read
DROP POLICY IF EXISTS "OrderItems: read anon" ON order_items;

