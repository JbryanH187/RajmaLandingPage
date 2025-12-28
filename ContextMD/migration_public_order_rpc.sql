-- Función segura para tracking público de órdenes (QR Code)
CREATE OR REPLACE FUNCTION get_public_order_v1(p_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS para acceso público
SET search_path = public -- Seguridad adicional
AS $$
DECLARE
    v_order RECORD;
    v_items JSON;
    v_status_history JSON;
    v_estimated_time TIMESTAMP;
BEGIN
    -- 1. Validar que el UUID no sea null
    IF p_order_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Invalid order ID'
        );
    END IF;

    -- 2. Obtener detalles de la orden (solo campos seguros)
    SELECT 
        o.id, 
        o.order_number, 
        o.status, 
        o.created_at,
        o.estimated_time,
        o.total, 
        -- Ocultar apellido por privacidad
        CASE 
            WHEN o.guest_name IS NOT NULL THEN
                SPLIT_PART(o.guest_name, ' ', 1) || ' ' || 
                LEFT(SPLIT_PART(o.guest_name, ' ', 2), 1) || '.'
            ELSE 'Guest'
        END as guest_name,
        o.order_type,
        -- Ocultar número de casa/depto por seguridad
        CASE 
            WHEN o.order_type = 'delivery' THEN 
                REGEXP_REPLACE(o.delivery_address, '\d+', '***', 'g')
            ELSE NULL
        END as delivery_address,
        -- Calcular tiempo transcurrido
        EXTRACT(EPOCH FROM (NOW() - o.created_at))/60 as minutes_elapsed,
        -- Estados de tiempo
        o.confirmed_at,
        o.preparing_at,
        o.ready_at,
        o.delivering_at,
        o.completed_at,
        o.cancelled_at
    INTO v_order
    FROM public.orders o
    WHERE o.id = p_order_id;

    -- 3. Verificar si existe la orden
    IF v_order IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Order not found'
        );
    END IF;

    -- 4. Obtener items (sin precios para el tracking público)
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

    -- 5. Calcular tiempo estimado basado en el estado
    v_estimated_time := CASE
        WHEN v_order.status = 'pending' THEN 
            v_order.created_at + INTERVAL '30 minutes'
        WHEN v_order.status = 'confirmed' THEN 
            v_order.confirmed_at + INTERVAL '25 minutes'
        WHEN v_order.status = 'preparing' THEN 
            v_order.preparing_at + INTERVAL '20 minutes'
        WHEN v_order.status = 'ready' AND v_order.order_type = 'pickup' THEN 
            NOW()
        WHEN v_order.status = 'ready' AND v_order.order_type = 'delivery' THEN 
            v_order.ready_at + INTERVAL '15 minutes'
        WHEN v_order.status = 'delivering' THEN 
            v_order.delivering_at + INTERVAL '15 minutes'
        ELSE NULL
    END;

    -- 6. Construir historial de estados
    v_status_history := json_build_object(
        'pending', v_order.created_at,
        'confirmed', v_order.confirmed_at,
        'preparing', v_order.preparing_at,
        'ready', v_order.ready_at,
        'delivering', v_order.delivering_at,
        'completed', v_order.completed_at,
        'cancelled', v_order.cancelled_at
    );

    -- 7. Retornar respuesta completa
    RETURN json_build_object(
        'success', true,
        'order', json_build_object(
            'id', v_order.id,
            'order_number', v_order.order_number,
            'status', v_order.status,
            'order_type', v_order.order_type,
            'guest_name', v_order.guest_name,
            'created_at', v_order.created_at,
            'estimated_time', v_estimated_time,
            'minutes_elapsed', ROUND(v_order.minutes_elapsed),
            'delivery_address', v_order.delivery_address,
            'items', COALESCE(v_items, '[]'::json),
            'status_history', v_status_history,
            'progress', CASE
                WHEN v_order.status = 'pending' THEN 10
                WHEN v_order.status = 'confirmed' THEN 25
                WHEN v_order.status = 'preparing' THEN 50
                WHEN v_order.status = 'ready' THEN 75
                WHEN v_order.status = 'delivering' THEN 85
                WHEN v_order.status = 'completed' THEN 100
                WHEN v_order.status = 'cancelled' THEN 0
                ELSE 0
            END
        )
    );

EXCEPTION WHEN OTHERS THEN
    -- Log error pero no exponer detalles internos
    RAISE WARNING 'Error in get_public_order_v1: %', SQLERRM;
    RETURN json_build_object(
        'success', false,
        'error', 'An error occurred while fetching the order'
    );
END;
$$;

-- Dar permisos para llamar la función
GRANT EXECUTE ON FUNCTION get_public_order_v1(UUID) TO anon, authenticated;