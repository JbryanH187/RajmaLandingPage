-- Patch: Fix create_complete_order to enforce auth.uid()
-- Description: Ensures that if an authenticated user creates an order, their ID is attached even if the payload misses it.

CREATE OR REPLACE FUNCTION create_complete_order(
  p_order_data jsonb,
  p_items jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_user_id uuid;
BEGIN
  -- Determine User ID: Payload OR Auth Context (Priority to Auth Context for security usually, but here we fallback)
  -- Actually, let's prioritize the payload if sent, but fallback to auth.uid() if not.
  -- Or better: If auth.uid() is present, ALWAYS use it? No, Admin creating for user? Admin might use payload.
  -- For now: COALESCE payload -> auth.uid()
  
  v_user_id := (p_order_data->>'user_id')::uuid;
  
  IF v_user_id IS NULL AND auth.uid() IS NOT NULL THEN
    v_user_id := auth.uid();
  END IF;

  -- 1. Insertar Orden
  INSERT INTO public.orders (
    user_id,
    guest_name,
    guest_email,
    guest_phone,
    order_type,
    delivery_address,
    subtotal,
    tax_amount,
    delivery_fee,
    tip_amount,
    total,
    payment_method,
    payment_status,
    notes,
    contact_phone
  ) VALUES (
    v_user_id, -- Use resolved User ID
    p_order_data->>'guest_name',
    p_order_data->>'guest_email',
    p_order_data->>'guest_phone',
    p_order_data->>'order_type',
    p_order_data->>'delivery_address',
    COALESCE((p_order_data->>'subtotal')::numeric, 0),
    COALESCE((p_order_data->>'tax_amount')::numeric, 0),
    COALESCE((p_order_data->>'delivery_fee')::numeric, 0),
    COALESCE((p_order_data->>'tip_amount')::numeric, 0),
    COALESCE((p_order_data->>'total')::numeric, 0),
    p_order_data->>'payment_method',
    'pending',
    p_order_data->>'notes',
    p_order_data->>'guest_phone'
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 2. Insertar Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      subtotal,
      notes
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'variant_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'subtotal')::numeric,
      v_item->>'notes'
    );
  END LOOP;

  -- 3. Retornar éxito
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'details', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
