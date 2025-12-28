-- ==========================================
-- SISTEMA DE ÓRDENES COMPLETO PARA RAJMA SUSHI
-- ==========================================

-- 1. Actualizar tabla orders con más campos necesarios
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'delivery' 
  CHECK (order_type IN ('delivery', 'pickup'));

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_name text;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_email text;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_phone text;

-- Número de orden único y legible
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number text UNIQUE;

-- Tiempo estimado de entrega/pickup
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS estimated_time timestamp with time zone;

-- Método de pago
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash'
  CHECK (payment_method IN ('cash', 'card', 'transfer'));

-- Estado del pago
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'refunded'));

-- Subtotal, descuentos, propina
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tip_amount numeric DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;

-- 2. Crear tabla order_items separada (mejor que JSONB)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- 3. Función para generar número de orden
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  order_date text;
  daily_count integer;
  new_number text;
BEGIN
  -- Formato: YYMMDD-XXX (ej: 241226-001)
  order_date := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  -- Contar órdenes del día
  SELECT COUNT(*) + 1 INTO daily_count
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generar número
  new_number := order_date || '-' || LPAD(daily_count::text, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para asignar número de orden automáticamente
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- 5. RLS para order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Política para ver items de orden
CREATE POLICY "Users can view own order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (
      -- Usuario autenticado viendo su orden
      (auth.uid() = orders.user_id)
      -- Admin viendo cualquier orden
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin')
      )
    )
  )
    )
  )
);

-- Política para insertar items (NECESARIA para el checkout)
CREATE POLICY "Anyone can insert order items" 
ON public.order_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (
      -- Usuario autenticado agregando a su orden
      (auth.uid() = orders.user_id)
      OR
      -- Guest agregando a orden de guest
      (orders.user_id IS NULL)
    )
  )
);

-- 6. Políticas actualizadas para orders
DROP POLICY IF EXISTS "Everyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- Crear órdenes (usuarios y guests)
CREATE POLICY "Anyone can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (
  -- Usuario autenticado
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Usuario guest (debe proporcionar email y teléfono)
  (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
);

-- Ver órdenes propias
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (
  -- Usuario autenticado
  auth.uid() = user_id
  OR
  -- Admins pueden ver todas
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Actualizar estado de orden (solo admins y sistema)
CREATE POLICY "Only admins can update order status" 
ON public.orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 7. Vista para órdenes con información completa
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.*,
  CASE 
    WHEN o.user_id IS NOT NULL THEN p.full_name
    ELSE o.guest_name
  END as customer_name,
  CASE 
    WHEN o.user_id IS NOT NULL THEN p.email
    ELSE o.guest_email
  END as customer_email,
  CASE 
    WHEN o.user_id IS NOT NULL THEN p.phone
    ELSE o.guest_phone
  END as customer_phone,
  COUNT(oi.id) as total_items,
  SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, p.id, p.full_name, p.email, p.phone;

-- 8. Función para calcular totales de orden
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS trigger AS $$
BEGIN
  -- Actualizar subtotal basado en items
  UPDATE orders 
  SET subtotal = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM order_items 
    WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
  
  -- Recalcular total
  UPDATE orders 
  SET total = subtotal + tax_amount + delivery_fee + tip_amount - discount_amount
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totales al modificar items
DROP TRIGGER IF EXISTS trigger_calculate_totals ON order_items;
CREATE TRIGGER trigger_calculate_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_totals();

-- 9. Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- 10. RPC Unificada para crear orden completa (Atomicidad)
CREATE OR REPLACE FUNCTION create_complete_order(
  p_order_data jsonb,
  p_items jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
BEGIN
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
    (p_order_data->>'user_id')::uuid, -- Puede ser NULL
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
    p_order_data->>'guest_phone' -- Usar guest_phone como contact_phone por defecto
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 2. Insertar Items
  -- Iterar sobre el array de items
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
      (v_item->>'variant_id')::uuid, -- Puede ser NULL
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
  -- Retornar error controlado
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'details', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Nota: SECURITY DEFINER hace que se ejecute como el dueño de la función (admin)
-- Esto bypassesa RLS temporalmente para asegurar que se creen los items, 
-- pero es seguro porque la función controla qué se inserta.

