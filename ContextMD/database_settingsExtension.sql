-- ==========================================
-- RAJMA SUSHI - CONFIGURACIÓN COMPLETA SUPABASE
-- ==========================================
-- Este script incluye todo lo que falta en el export básico:
-- RLS, Políticas, Triggers, Funciones y Datos iniciales

-- ==========================================
-- 1. HABILITAR EXTENSIONES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. FUNCIÓN Y TRIGGER PARA NUEVOS USUARIOS
-- ==========================================
-- Función que crea un perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función al crear usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. POLÍTICAS RLS - PROFILES
-- ==========================================
-- Los perfiles son públicos (solo lectura)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Los usuarios pueden ver sus propios datos completos
CREATE POLICY "Users can view own profile details" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- ==========================================
-- 5. POLÍTICAS RLS - CATEGORIES
-- ==========================================
-- Las categorías son públicas (todos pueden ver)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

-- Solo admins pueden gestionar categorías
CREATE POLICY "Only admins can insert categories" 
ON public.categories FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only admins can update categories" 
ON public.categories FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only admins can delete categories" 
ON public.categories FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 6. POLÍTICAS RLS - PRODUCTS
-- ==========================================
-- Los productos son públicos (todos pueden ver)
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
USING (true);

-- Solo admins pueden gestionar productos
CREATE POLICY "Only admins can manage products" 
ON public.products FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 7. POLÍTICAS RLS - PRODUCT_VARIANTS
-- ==========================================
-- Las variantes son públicas (todos pueden ver)
CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (true);

-- Solo admins pueden gestionar variantes
CREATE POLICY "Only admins can manage product variants" 
ON public.product_variants FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 8. POLÍTICAS RLS - ORDERS
-- ==========================================
-- Los usuarios pueden ver sus propias órdenes
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Los usuarios pueden crear órdenes
CREATE POLICY "Users can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus órdenes (ej: cancelar)
CREATE POLICY "Users can update own orders" 
ON public.orders FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND status IN ('pending', 'confirmed')
);

-- Los admins pueden ver todas las órdenes
CREATE POLICY "Admins can view all orders" 
ON public.orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Los admins pueden actualizar cualquier orden
CREATE POLICY "Admins can update all orders" 
ON public.orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 9. STORAGE BUCKET CONFIGURATION
-- ==========================================
-- Nota: Los buckets se crean desde el Dashboard, pero aquí están las políticas SQL

-- Política para ver imágenes del menú (público)
-- CREATE POLICY "Menu images are public" 
-- ON storage.objects FOR SELECT 
-- USING (bucket_id = 'menu-images');

-- Política para que admins suban imágenes
-- CREATE POLICY "Admins can upload menu images" 
-- ON storage.objects FOR INSERT 
-- WITH CHECK (
--   bucket_id = 'menu-images' 
--   AND EXISTS (
--     SELECT 1 FROM profiles 
--     WHERE id = auth.uid() 
--     AND role IN ('admin', 'super_admin')
--   )
-- );

-- CREATE POLICY "Admins can update menu images" 
-- ON storage.objects FOR UPDATE 
-- USING (
--   bucket_id = 'menu-images' 
--   AND EXISTS (
--     SELECT 1 FROM profiles 
--     WHERE id = auth.uid() 
--     AND role IN ('admin', 'super_admin')
--   )
-- );

-- CREATE POLICY "Admins can delete menu images" 
-- ON storage.objects FOR DELETE 
-- USING (
--   bucket_id = 'menu-images' 
--   AND EXISTS (
--     SELECT 1 FROM profiles 
--     WHERE id = auth.uid() 
--     AND role IN ('admin', 'super_admin')
--   )
-- );

-- ==========================================
-- 10. DATOS INICIALES - CATEGORÍAS
-- ==========================================
INSERT INTO public.categories (id, label, sort_order) VALUES
('entradas', 'Entradas', 1),
('naturales', 'Sushi Natural', 2),
('empanizados', 'Empanizados', 3),
('especiales', 'Especiales y Horneados', 4),
('platillos', 'Platillos y Combos', 5),
('charolas', 'Charolas', 6)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 11. DATOS INICIALES - PRODUCTOS
-- ==========================================
-- Productos de ENTRADAS
INSERT INTO public.products (name, description, price, category_id, tags, is_available) VALUES
('Tostada de Atún', 'Atún, pepino, aguacate, mango (en temporada), salsa negra.', 70, 'entradas', ARRAY['popular'], true),
('Tostada Veneno', 'Camarón cocido, pepino, cebolla, salsa de la casa.', 65, 'entradas', NULL, true),
('Chile Relleno', 'Relleno de Philadelphia, tampico y carne a elección.', 95, 'entradas', NULL, true),
('Chile Momia', 'Relleno de Philadelphia, tampico y carne, envuelto en tocino.', 105, 'entradas', NULL, true),
('Camarones Roca', NULL, 105, 'entradas', NULL, true)
ON CONFLICT DO NOTHING;

-- Productos de NATURALES
INSERT INTO public.products (name, description, price, category_id, tags, is_available) VALUES
('Campechano', 'Camarón y atún por dentro, Togarashi por fuera.', 105, 'naturales', ARRAY['spicy'], true),
('Aguachile', 'Bañado en salsa especial Rajma.', 115, 'naturales', ARRAY['popular'], true),
('Icha Roll', 'Camarón empanizado + topping de camarón picosito.', 100, 'naturales', ARRAY['spicy'], true)
ON CONFLICT DO NOTHING;

-- Productos de EMPANIZADOS
INSERT INTO public.products (name, description, price, category_id, tags, is_available) VALUES
('Cielo, Mar y Tierra', NULL, 95, 'empanizados', NULL, true),
('Sinnombre', 'Pollo frito BBQ, cebollín, salsa de anguila.', 103, 'empanizados', NULL, true),
('Prali', 'Res/Tocino con topping de camarón empanizado picosito.', 110, 'empanizados', NULL, true),
('Dedos Roll', 'Topping de dedos de queso.', 103, 'empanizados', NULL, true)
ON CONFLICT DO NOTHING;

-- Productos de ESPECIALES
INSERT INTO public.products (name, description, price, category_id, tags, is_available) VALUES
('Dragon', NULL, 100, 'especiales', NULL, true),
('Innombrable', NULL, 135, 'especiales', NULL, true),
('Rajma Roll', NULL, 135, 'especiales', ARRAY['popular'], true),
('Horneado Lava', NULL, 125, 'especiales', NULL, true)
ON CONFLICT DO NOTHING;

-- Productos de PLATILLOS
INSERT INTO public.products (name, description, price, category_id, tags, is_available) VALUES
('Yakimeshi / Gohan', NULL, 70, 'platillos', NULL, true),
('Bombas de Arroz', NULL, 90, 'platillos', NULL, true),
('Combo pa 2', 'Guamuchilito + Volcán + 1 Rollito + 1 Chile Relleno + Té.', 295, 'platillos', NULL, true)
ON CONFLICT DO NOTHING;

-- Productos de CHAROLAS
INSERT INTO public.products (name, description, price, category_id, tags, is_available) VALUES
('Charola Clásica', NULL, 315, 'charolas', NULL, true),
('Charola Gratinada', NULL, 365, 'charolas', NULL, true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 12. DATOS INICIALES - VARIANTES DE PRODUCTOS
-- ==========================================
-- Nota: Las variantes necesitan los IDs de productos que son UUIDs generados
-- Por lo tanto, usamos subqueries para obtener los IDs correctos

-- Variantes de Chile Relleno
INSERT INTO public.product_variants (product_id, name, price)
SELECT id, 'Orden (3 pzas)', 95 FROM products WHERE name = 'Chile Relleno'
UNION ALL
SELECT id, 'Individual (1 pza)', 35 FROM products WHERE name = 'Chile Relleno'
ON CONFLICT DO NOTHING;

-- Variantes de Chile Momia
INSERT INTO public.product_variants (product_id, name, price)
SELECT id, 'Orden (3 pzas)', 105 FROM products WHERE name = 'Chile Momia'
UNION ALL
SELECT id, 'Individual (1 pza)', 40 FROM products WHERE name = 'Chile Momia'
ON CONFLICT DO NOTHING;

-- Variantes de Yakimeshi / Gohan
INSERT INTO public.product_variants (product_id, name, price)
SELECT id, 'Sencillo', 70 FROM products WHERE name = 'Yakimeshi / Gohan'
UNION ALL
SELECT id, 'Especial', 110 FROM products WHERE name = 'Yakimeshi / Gohan'
ON CONFLICT DO NOTHING;

-- Variantes de Charola Clásica
INSERT INTO public.product_variants (product_id, name, price)
SELECT id, '50 Piezas', 315 FROM products WHERE name = 'Charola Clásica'
UNION ALL
SELECT id, '70 Piezas', 455 FROM products WHERE name = 'Charola Clásica'
ON CONFLICT DO NOTHING;

-- Variantes de Charola Gratinada
INSERT INTO public.product_variants (product_id, name, price)
SELECT id, '50 Piezas', 365 FROM products WHERE name = 'Charola Gratinada'
UNION ALL
SELECT id, '70 Piezas', 535 FROM products WHERE name = 'Charola Gratinada'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 13. ÍNDICES PARA MEJOR RENDIMIENTO
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ==========================================
-- FIN DEL SCRIPT
-- ==========================================
-- Notas importantes:
-- 1. Este script asume que las tablas ya existen (fueron creadas por el export inicial)
-- 2. Las políticas de storage están comentadas porque requieren que el bucket exista primero
-- 3. Los datos usan ON CONFLICT DO NOTHING para evitar duplicados si se ejecuta múltiples veces
-- 4. Recuerda crear el bucket 'menu-images' desde el Dashboard de Supabase

-- ==========================================
-- MODIFICACIONES A LA TABLA ORDERS
-- ==========================================

-- Hacer nullable la columna items si existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'items' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders ALTER COLUMN items DROP NOT NULL;
  END IF;
END $$;

-- Agregar nuevas columnas
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'delivery' 
  CHECK (order_type IN ('delivery', 'pickup'));

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_name text;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_email text;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_phone text;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number text UNIQUE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS estimated_time timestamp with time zone;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash'
  CHECK (payment_method IN ('cash', 'card', 'transfer'));

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'refunded'));

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

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- ==========================================
-- FUNCIONES Y TRIGGERS
-- ==========================================

-- Función para generar número de orden
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  order_date text;
  daily_count integer;
  new_number text;
BEGIN
  order_date := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  SELECT COUNT(*) + 1 INTO daily_count
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_number := order_date || '-' || LPAD(daily_count::text, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Función para trigger de número de orden
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para número de orden
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Función para calcular totales (versión corregida)
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS trigger AS $$
DECLARE
  target_order_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_order_id := OLD.order_id;
  ELSE
    target_order_id := NEW.order_id;
  END IF;
  
  UPDATE orders 
  SET subtotal = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM order_items 
    WHERE order_id = target_order_id
  )
  WHERE id = target_order_id;
  
  UPDATE orders 
  SET total = subtotal + tax_amount + delivery_fee + tip_amount - discount_amount
  WHERE id = target_order_id;
  
  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular totales
DROP TRIGGER IF EXISTS trigger_calculate_totals ON order_items;
CREATE TRIGGER trigger_calculate_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_totals();

  -- ==========================================
-- VISTAS
-- ==========================================

-- Eliminar vista anterior si existe
DROP VIEW IF EXISTS order_details CASCADE;

-- Crear vista mejorada
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.id,
  o.user_id,
  o.order_number,
  o.order_type,
  o.status,
  o.payment_method,
  o.payment_status,
  o.delivery_address,
  o.contact_phone,
  o.notes,
  o.subtotal,
  o.tax_amount,
  o.delivery_fee,
  o.tip_amount,
  o.discount_amount,
  o.total,
  o.estimated_time,
  o.created_at,
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
  COUNT(DISTINCT oi.id) as total_items,
  COALESCE(SUM(oi.quantity), 0) as total_quantity
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, p.id, p.full_name, p.email, p.phone;

-- ==========================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Everyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can update order status" ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

-- POLÍTICAS PARA ORDERS

-- Crear órdenes
CREATE POLICY "Anyone can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
);

-- Ver órdenes
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Actualizar órdenes
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

-- POLÍTICAS PARA ORDER_ITEMS

-- Ver items
CREATE POLICY "Users can view own order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (
      (auth.uid() = orders.user_id)
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin')
      )
    )
  )
);

-- Insertar items (solo con orden válida)
CREATE POLICY "Insert order items with valid order" 
ON public.order_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id
  )
);