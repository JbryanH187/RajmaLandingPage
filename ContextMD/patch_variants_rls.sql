-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public can read variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Public can read products" ON public.products;

-- POLÍTICA PARA PRODUCT_VARIANTS - Admins pueden hacer todo
CREATE POLICY "Admins can manage variants"
ON public.product_variants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() 
    AND r.is_active = true
    AND r.name IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() 
    AND r.is_active = true
    AND r.name IN ('admin', 'super_admin')
  )
);

-- POLÍTICA PARA PRODUCTS - Admins pueden hacer todo
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() 
    AND r.is_active = true
    AND r.name IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() 
    AND r.is_active = true
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Políticas públicas para lectura (todos pueden ver productos)
CREATE POLICY "Public can read variants"
ON public.product_variants 
FOR SELECT
USING (true);

CREATE POLICY "Public can read products"
ON public.products 
FOR SELECT
USING (true);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role_id);
CREATE INDEX IF NOT EXISTS idx_roles_id_active ON public.roles(id, is_active) WHERE is_active = true;
