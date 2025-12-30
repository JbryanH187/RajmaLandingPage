-- FIX: Add missing columns causing 502 Error in get_public_order_v1
-- The RPC function references these columns. If they don't exist, the function crashes (502).

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS preparing_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ready_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivering_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- Re-apply the function to ensure it uses the new schema (Plan Cache invalidation)
CREATE OR REPLACE FUNCTION get_public_order_v1(p_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_items JSON;
    v_status_history JSON;
    v_estimated_time TIMESTAMP;
BEGIN
    -- 1. Validar inputs
    IF p_order_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid order ID');
    END IF;

    -- 2. Obtener orden (Ahora seguro porque las columnas existen)
    SELECT 
        o.id, 
        o.order_number, 
        o.status, 
        o.created_at,
        o.estimated_time,
        o.total,
        o.order_type,
        o.delivery_address, -- Puede ser texto raw
        o.guest_name,
        -- Timestamps (Ahora existen)
        o.confirmed_at,
        o.preparing_at,
        o.ready_at,
        o.delivering_at,
        o.completed_at,
        o.cancelled_at
    INTO v_order
    FROM public.orders o
    WHERE o.id = p_order_id;

    IF v_order IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- 3. Obtener items
    SELECT json_agg(
        json_build_object(
            'quantity', oi.quantity,
            'name', p.name,
            'variant', pv.name,
            'notes', oi.notes
        ) ORDER BY p.name
    )
    INTO v_items
    FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    LEFT JOIN public.product_variants pv ON oi.variant_id = pv.id
    WHERE oi.order_id = p_order_id;

    -- 4. Status History Object
    v_status_history := json_build_object(
        'pending', v_order.created_at,
        'confirmed', v_order.confirmed_at,
        'preparing', v_order.preparing_at,
        'ready', v_order.ready_at,
        'delivering', v_order.delivering_at,
        'completed', v_order.completed_at,
        'cancelled', v_order.cancelled_at
    );

    -- 5. Retorno
    RETURN json_build_object(
        'success', true,
        'order', json_build_object(
            'id', v_order.id,
            'order_number', v_order.order_number,
            'status', v_order.status,
            'guest_name', v_order.guest_name,
            'created_at', v_order.created_at,
            'items', COALESCE(v_items, '[]'::json),
            'status_history', v_status_history
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
