-- Migration: Add Delivery Instructions & Restaurant Status
-- Description: Adds delivery_instructions to orders table and creates restaurant_status table.

-- 1. Add delivery_instructions to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- 2. Create restaurant_status table (Singleton pattern)
CREATE TABLE IF NOT EXISTS public.restaurant_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_open BOOLEAN DEFAULT TRUE,
    is_temporarily_closed BOOLEAN DEFAULT FALSE,
    closed_message TEXT DEFAULT 'Estamos cerrados temporalmente.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT singleton_check CHECK (id = 1)
);

-- 3. Initial Insert (if empty)
INSERT INTO public.restaurant_status (id, is_open, is_temporarily_closed)
VALUES (1, TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS for restaurant_status (Public Read, Admin Write)
ALTER TABLE public.restaurant_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" 
ON public.restaurant_status FOR SELECT 
USING (true);

CREATE POLICY "Admin Write Access" 
ON public.restaurant_status FOR ALL 
USING ( public.is_admin() ); -- Assuming is_admin() function exists from previous migrations

-- 5. Update create_complete_order function to handle delivery_instructions
-- Note: If previous RPC used jsonb_populate_record(null::orders, ...), adding column to table is sufficient.
-- If it explicitly lists columns, users might need to update the function.
-- Given I cannot see the function definition, I will trust that adding the column is the first critical step.
