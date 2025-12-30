-- Restoring create_complete_order RPC based on User Feedback

CREATE OR REPLACE FUNCTION create_complete_order(
  p_order_data json,
  p_items json
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_item json;
  v_date_prefix text;
  v_next_num integer;
BEGIN
  v_date_prefix := TO_CHAR(NOW(), 'YYMMDD');
  v_order_id := gen_random_uuid();
  
  -- Generar número con LOCK
  LOCK TABLE orders IN SHARE ROW EXCLUSIVE MODE;
  
  -- Obtener el siguiente número
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(order_number FROM '^\d{6}-(\d{3})')  -- Mejorado el regex
      AS INTEGER
    )
  ), 0) + 1
  INTO v_next_num
  FROM orders
  WHERE order_number LIKE v_date_prefix || '-%';
  
  v_order_number := v_date_prefix || '-' || LPAD(v_next_num::text, 3, '0');
  
  -- Crear la orden
  INSERT INTO orders (
    id,
    order_number,
    user_id,
    guest_name, guest_email, guest_phone, contact_phone,
    order_type, delivery_address, delivery_instructions,
    subtotal, tax_amount, delivery_fee, tip_amount, total,
    payment_method, status, payment_status, notes
  ) VALUES (
    v_order_id,
    v_order_number,
    NULLIF(p_order_data->>'user_id', '')::uuid,
    p_order_data->>'guest_name',
    p_order_data->>'guest_email', 
    p_order_data->>'guest_phone',
    COALESCE(p_order_data->>'contact_phone', p_order_data->>'guest_phone'),
    COALESCE(p_order_data->>'order_type', 'delivery'),
    p_order_data->>'delivery_address',
    p_order_data->>'delivery_instructions',
    COALESCE((p_order_data->>'subtotal')::numeric, 0),
    COALESCE((p_order_data->>'tax_amount')::numeric, 0),
    COALESCE((p_order_data->>'delivery_fee')::numeric, 0),
    COALESCE((p_order_data->>'tip_amount')::numeric, 0),
    COALESCE((p_order_data->>'total')::numeric, 0),
    COALESCE(p_order_data->>'payment_method', 'cash'),
    'pending',
    'pending',
    p_order_data->>'notes'
  );
  
  -- Insertar items
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, product_id, variant_id, 
      quantity, unit_price, subtotal, notes
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      CASE 
        WHEN v_item->>'variant_id' = 'null' OR v_item->>'variant_id' IS NULL 
        THEN NULL 
        ELSE (v_item->>'variant_id')::uuid 
      END,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'subtotal')::numeric,
      NULLIF(v_item->>'notes', 'null')
    );
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'items_count', json_array_length(p_items)
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;
