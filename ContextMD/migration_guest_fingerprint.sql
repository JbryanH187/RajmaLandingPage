-- Agregar columnas para el sistema de fingerprinting
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(255),
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS fingerprint_created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_device_seen_at TIMESTAMP DEFAULT NOW();

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_orders_device_fingerprint ON orders(device_fingerprint) 
WHERE device_fingerprint IS NOT NULL AND status IN ('pending', 'preparing', 'out_for_delivery');

-- Índice para limpieza de datos antiguos
CREATE INDEX IF NOT EXISTS idx_orders_fingerprint_cleanup 
ON orders(fingerprint_created_at) 
WHERE device_fingerprint IS NOT NULL;

-- RPC: Buscar orden activa por dispositivo
CREATE OR REPLACE FUNCTION get_active_order_by_device(
  p_device_fingerprint TEXT,
  p_guest_email TEXT DEFAULT NULL,
  p_guest_phone TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_items json;
BEGIN
  -- Buscar por fingerprint primero
  SELECT o.* INTO v_order
  FROM orders o
  WHERE o.device_fingerprint = p_device_fingerprint
    AND o.status IN ('pending', 'preparing', 'out_for_delivery')
    AND o.user_id IS NULL
  ORDER BY o.created_at DESC
  LIMIT 1;
  
  -- Si no encuentra por fingerprint, buscar por email o teléfono
  IF v_order IS NULL AND (p_guest_email IS NOT NULL OR p_guest_phone IS NOT NULL) THEN
    SELECT o.* INTO v_order
    FROM orders o
    WHERE o.user_id IS NULL
      AND o.status IN ('pending', 'preparing', 'out_for_delivery')
      AND (
        (p_guest_email IS NOT NULL AND o.guest_email = p_guest_email) OR
        (p_guest_phone IS NOT NULL AND o.guest_phone = p_guest_phone)
      )
    ORDER BY o.created_at DESC
    LIMIT 1;
  END IF;
  
  -- Si encuentra una orden, obtener los items
  IF v_order.id IS NOT NULL THEN
    -- Actualizar última vez visto
    UPDATE orders 
    SET last_device_seen_at = NOW()
    WHERE id = v_order.id;
    
    -- Obtener items de la orden
    SELECT json_agg(
      json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', p.name,
        'variant_id', oi.variant_id,
        'variant_name', pv.name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'subtotal', oi.subtotal,
        'notes', oi.notes
      )
    ) INTO v_items
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = v_order.id;
    
    RETURN json_build_object(
      'success', true,
      'order', json_build_object(
        'id', v_order.id,
        'order_number', v_order.order_number,
        'status', v_order.status,
        'total', v_order.total,
        'guest_name', v_order.guest_name,
        'guest_email', v_order.guest_email,
        'guest_phone', v_order.guest_phone,
        'delivery_address', v_order.delivery_address,
        'created_at', v_order.created_at,
        'items', v_items
      )
    );
  END IF;
  
  RETURN json_build_object(
    'success', false,
    'order', null
  );
END;
$$;

-- Permisos RPC 1
GRANT EXECUTE ON FUNCTION get_active_order_by_device(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_active_order_by_device(TEXT, TEXT, TEXT) TO authenticated;

-- RPC: Crear orden completa (Reemplazo o Nuevo)
CREATE OR REPLACE FUNCTION create_complete_order(p_order_data jsonb, p_items json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_item json;
  v_date_prefix text;
  v_next_num integer;
  v_existing_max integer;
BEGIN
  -- Establecer contexto de creación de orden
  SET LOCAL app.in_order_creation = 'true';
  
  v_date_prefix := TO_CHAR(NOW(), 'YYMMDD');
  v_order_id := gen_random_uuid();
  
  -- Verificar el máximo existente
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '^\d{6}-(\d{3})') AS INTEGER)), 0)
  INTO v_existing_max
  FROM orders
  WHERE order_number LIKE v_date_prefix || '-%';
  
  -- Sincronizar la tabla de secuencias
  INSERT INTO daily_order_sequences (date_prefix, last_number)
  VALUES (v_date_prefix, v_existing_max)
  ON CONFLICT (date_prefix) 
  DO UPDATE SET last_number = GREATEST(daily_order_sequences.last_number, EXCLUDED.last_number);
  
  -- Obtener el siguiente número
  UPDATE daily_order_sequences
  SET last_number = last_number + 1
  WHERE date_prefix = v_date_prefix
  RETURNING last_number INTO v_next_num;
  
  v_order_number := v_date_prefix || '-' || LPAD(v_next_num::text, 3, '0');
  
  -- Crear la orden con device fingerprint
  INSERT INTO orders (
    id,
    order_number,
    user_id,
    guest_name, guest_email, guest_phone, contact_phone,
    order_type, delivery_address, delivery_instructions,
    subtotal, tax_amount, delivery_fee, tip_amount, total,
    payment_method, status, payment_status, notes,
    device_fingerprint, device_info  -- NUEVOS CAMPOS
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
    p_order_data->>'notes',
    p_order_data->>'device_fingerprint',  -- NUEVO
    p_order_data->'device_info'            -- NUEVO
  );
  
  -- Insertar items (código existente)
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

-- RPC: Actualizar Fingerprint (si cambia de dispositivo y hace login/recuperación)
CREATE OR REPLACE FUNCTION update_order_fingerprint(
  p_order_id uuid,
  p_device_fingerprint TEXT,
  p_device_info jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orders
  SET 
    device_fingerprint = p_device_fingerprint,
    device_info = COALESCE(p_device_info, device_info),
    last_device_seen_at = NOW()
  WHERE id = p_order_id
    AND user_id IS NULL  -- Solo para órdenes de invitados
    AND status IN ('pending', 'preparing', 'out_for_delivery');
  
  IF FOUND THEN
    RETURN json_build_object('success', true);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Order not found or not eligible');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION update_order_fingerprint(uuid, TEXT, jsonb) TO anon;
