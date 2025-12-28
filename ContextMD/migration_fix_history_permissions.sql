-- FIX HISTORY PERMISSIONS
-- The user cannot see history because reading 'orders' is likely blocked by RLS.

-- 1. Enable RLS on Orders tables (Good practice)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. ORDERS Policies
-- Users can see their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    (guest_email IS NOT NULL AND guest_email = (select email from auth.users where id = auth.uid()))
  );

-- Users can insert their own orders (already covered but good to ensure)
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL); -- Allow guest/anon inserts too if userId is null

-- 3. ORDER_ITEMS Policies
-- Items are visible if the parent order is visible
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id 
      AND (
        o.user_id = auth.uid()
        OR 
        (o.guest_email IS NOT NULL AND o.guest_email = (select email from auth.users where id = auth.uid()))
      )
    )
  );

-- 4. Grant Permissions to Views (Just in case)
GRANT SELECT ON public.user_order_history TO authenticated;
GRANT SELECT ON public.order_full_details TO authenticated;

-- 5. Helper Function Fix (If RPC fails)
-- Ensure get_user_orders is accessible
GRANT EXECUTE ON FUNCTION public.get_user_orders TO authenticated, anon;
