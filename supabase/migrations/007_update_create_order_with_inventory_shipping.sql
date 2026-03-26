-- Update create_order_with_inventory to persist shipping totals.

CREATE OR REPLACE FUNCTION public.create_order_with_inventory(
  p_user_id UUID,
  p_shipping_info JSONB,
  p_items JSONB,
  p_shipping_total NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_items_total NUMERIC(10,2) := 0;
  v_shipping_total NUMERIC(10,2) := 0;
  v_grand_total NUMERIC(10,2) := 0;
  v_item JSONB;
  v_product_id UUID;
  v_qty INT;
  v_unit_price NUMERIC(10,2);
  v_stock INT;
  v_price NUMERIC(10,2);
  v_sale_price NUMERIC(10,2);
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_ITEMS';
  END IF;

  v_shipping_total := COALESCE(p_shipping_total, 0);
  IF v_shipping_total < 0 THEN
    RAISE EXCEPTION 'INVALID_SHIPPING_TOTAL';
  END IF;

  -- Create the order first (totals updated after calculating).
  INSERT INTO public.orders (user_id, status, total, items_total, shipping_total, grand_total, shipping_info)
  VALUES (p_user_id, 'pending', 0, 0, v_shipping_total, 0, COALESCE(p_shipping_info, '{}'::jsonb))
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;

    IF v_product_id IS NULL OR v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_ITEM';
    END IF;

    -- Lock product row to prevent oversell.
    SELECT stock, price, sale_price
    INTO v_stock, v_price, v_sale_price
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
    END IF;

    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%', v_product_id;
    END IF;

    v_unit_price := COALESCE(v_sale_price, v_price);
    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'NO_PRICE';
    END IF;

    UPDATE public.products
    SET stock = stock - v_qty
    WHERE id = v_product_id;

    INSERT INTO public.order_items (order_id, product_id, qty, unit_price)
    VALUES (v_order_id, v_product_id, v_qty, v_unit_price);

    v_items_total := v_items_total + (v_unit_price * v_qty);
  END LOOP;

  v_grand_total := v_items_total + v_shipping_total;

  UPDATE public.orders
  SET
    items_total = v_items_total,
    shipping_total = v_shipping_total,
    grand_total = v_grand_total,
    total = v_grand_total,
    updated_at = NOW()
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

