-- FIX 500 ERROR: RECURSIVE RLS POLICIES
-- The previous policy created an infinite loop by querying 'profiles' inside the 'profiles' policy.

-- 1. Helper function to check admin status safely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER allows this function to read 'profiles' even if RLS would block it normally.

-- 2. Fix PROFILES Policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_admin() -- Uses the secure function instead of recursive query
  );

-- 3. Fix MENU Policies (Categories, Products, Variants)
-- Ensure they use the safe function too

-- Categories
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE USING (public.is_admin());

-- Products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE USING (public.is_admin());

-- Variants
DROP POLICY IF EXISTS "Admins can insert variants" ON public.product_variants;
CREATE POLICY "Admins can insert variants"
  ON public.product_variants FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update variants" ON public.product_variants;
CREATE POLICY "Admins can update variants"
  ON public.product_variants FOR UPDATE USING (public.is_admin());
