-- Remove anonymous mutations for orders/order_items.
-- Guest checkout should go through server API using service role,
-- so anonymous clients cannot tamper with someone else's guest order.

DROP POLICY IF EXISTS "OrderItems: insert anon" ON order_items;
DROP POLICY IF EXISTS "Orders: insert anon" ON orders;

