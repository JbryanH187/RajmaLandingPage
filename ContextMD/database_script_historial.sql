-- ==========================================
-- RAJMA SUSHI - SISTEMA DE ANÁLISIS DE ÓRDENES
-- ==========================================
-- Este archivo incluye vistas y funciones para:
-- 1. Historial de órdenes para usuarios
-- 2. Dashboard administrativo
-- 3. Análisis y reportes
-- ==========================================

-- ==========================================
-- VISTAS PARA USUARIOS (HISTORIAL DE ÓRDENES)
-- ==========================================

-- Vista: Historial de órdenes del usuario con resumen
CREATE OR REPLACE VIEW user_order_history AS
SELECT 
  o.id,
  o.order_number,
  o.created_at,
  o.order_type,
  o.delivery_address,
  o.status,
  o.payment_method,
  o.payment_status,
  o.total,
  o.estimated_time,
  COUNT(DISTINCT oi.id) as items_count,
  SUM(oi.quantity) as total_items,
  string_agg(DISTINCT p.name, ', ' ORDER BY p.name) as products_summary
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id;

-- Vista: Detalle completo de una orden
CREATE OR REPLACE VIEW order_full_details AS
SELECT 
  o.*,
  json_agg(
    json_build_object(
      'item_id', oi.id,
      'product_id', oi.product_id,
      'product_name', p.name,
      'product_image', p.image_url,
      'variant_id', oi.variant_id,
      'variant_name', pv.name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'subtotal', oi.subtotal,
      'notes', oi.notes,
      'category', c.label
    ) ORDER BY p.name
  ) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN product_variants pv ON oi.variant_id = pv.id
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY o.id;

-- ==========================================
-- FUNCIONES PARA USUARIOS
-- ==========================================

-- Función: Obtener historial de órdenes del usuario
CREATE OR REPLACE FUNCTION get_user_orders(
  p_user_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  WITH user_orders AS (
    SELECT 
      o.id,
      o.order_number,
      o.created_at,
      o.order_type,
      o.status,
      o.total,
      COUNT(oi.id) as items_count,
      array_agg(
        json_build_object(
          'name', p.name,
          'quantity', oi.quantity,
          'image', p.image_url
        ) ORDER BY oi.created_at
      ) as items_preview
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE 
      (p_user_id IS NOT NULL AND o.user_id = p_user_id)
      OR 
      (p_email IS NOT NULL AND (o.guest_email = p_email OR EXISTS (
        SELECT 1 FROM profiles WHERE id = o.user_id AND email = p_email
      )))
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT json_build_object(
    'orders', COALESCE(json_agg(user_orders.*), '[]'::json),
    'total_orders', (
      SELECT COUNT(DISTINCT o.id) 
      FROM orders o
      WHERE 
        (p_user_id IS NOT NULL AND o.user_id = p_user_id)
        OR 
        (p_email IS NOT NULL AND (o.guest_email = p_email OR EXISTS (
          SELECT 1 FROM profiles WHERE id = o.user_id AND email = p_email
        )))
    )
  ) INTO v_result
  FROM user_orders;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener estadísticas del usuario
CREATE OR REPLACE FUNCTION get_user_stats(
  p_user_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'total_orders', (
      SELECT COUNT(*) FROM orders o
      WHERE (p_user_id IS NOT NULL AND o.user_id = p_user_id)
         OR (p_email IS NOT NULL AND o.guest_email = p_email)
    ),
    'total_spent', (
      SELECT COALESCE(SUM(total), 0) FROM orders o
      WHERE (p_user_id IS NOT NULL AND o.user_id = p_user_id)
         OR (p_email IS NOT NULL AND o.guest_email = p_email)
    ),
    'favorite_products', (
      SELECT json_agg(fp.*)
      FROM (
        SELECT 
          p.name,
          p.image_url,
          SUM(oi.quantity) as times_ordered,
          SUM(oi.subtotal) as total_spent
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE (p_user_id IS NOT NULL AND o.user_id = p_user_id)
           OR (p_email IS NOT NULL AND o.guest_email = p_email)
        GROUP BY p.id, p.name, p.image_url
        ORDER BY times_ordered DESC
        LIMIT 5
      ) fp
    ),
    'preferred_order_type', (
      SELECT order_type
      FROM orders o
      WHERE (p_user_id IS NOT NULL AND o.user_id = p_user_id)
         OR (p_email IS NOT NULL AND o.guest_email = p_email)
      GROUP BY order_type
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'last_order_date', (
      SELECT MAX(created_at) FROM orders o
      WHERE (p_user_id IS NOT NULL AND o.user_id = p_user_id)
         OR (p_email IS NOT NULL AND o.guest_email = p_email)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- VISTAS PARA ADMINISTRADORES (DASHBOARD)
-- ==========================================

-- Vista: Resumen diario de ventas (CORREGIDA)
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
  DATE(created_at AT TIME ZONE 'America/Tijuana') as sale_date,
  COUNT(DISTINCT id) as total_orders,
  COUNT(DISTINCT CASE WHEN order_type = 'delivery' THEN id END) as delivery_orders,
  COUNT(DISTINCT CASE WHEN order_type = 'pickup' THEN id END) as pickup_orders,
  COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as completed_orders,
  COUNT(DISTINCT CASE WHEN status = 'cancelled' THEN id END) as cancelled_orders,
  SUM(CASE WHEN status != 'cancelled' THEN subtotal ELSE 0 END) as gross_sales,
  SUM(CASE WHEN status != 'cancelled' THEN tax_amount ELSE 0 END) as total_tax,
  SUM(CASE WHEN status != 'cancelled' THEN delivery_fee ELSE 0 END) as total_delivery_fees,
  SUM(CASE WHEN status != 'cancelled' THEN tip_amount ELSE 0 END) as total_tips,
  SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) as net_sales,
  AVG(CASE WHEN status != 'cancelled' THEN total ELSE NULL END) as average_order_value
FROM orders
GROUP BY DATE(created_at AT TIME ZONE 'America/Tijuana');

-- Vista: Productos más vendidos
CREATE OR REPLACE VIEW top_selling_products AS
SELECT 
  p.id,
  p.name,
  p.image_url,
  c.label as category,
  COUNT(DISTINCT oi.order_id) as times_ordered,
  SUM(oi.quantity) as units_sold,
  SUM(oi.subtotal) as revenue,
  AVG(oi.unit_price) as average_price,
  RANK() OVER (ORDER BY SUM(oi.quantity) DESC) as popularity_rank
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE o.status != 'cancelled'
GROUP BY p.id, p.name, p.image_url, c.label;

-- Vista: Análisis por categoría
CREATE OR REPLACE VIEW category_performance AS
SELECT 
  c.id,
  c.label as category_name,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT oi.order_id) as orders_count,
  SUM(oi.quantity) as items_sold,
  SUM(oi.subtotal) as revenue,
  AVG(oi.subtotal/NULLIF(oi.quantity, 0)) as avg_item_price,
  RANK() OVER (ORDER BY SUM(oi.subtotal) DESC) as revenue_rank
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
GROUP BY c.id, c.label;

-- ==========================================
-- FUNCIONES PARA ADMINISTRADORES
-- ==========================================

-- Función: Dashboard principal del admin
CREATE OR REPLACE FUNCTION get_admin_dashboard(
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    -- KPIs principales
    'kpis', json_build_object(
      'total_orders', (
        SELECT COUNT(*) FROM orders 
        WHERE DATE(created_at AT TIME ZONE 'America/Tijuana') BETWEEN p_start_date AND p_end_date
      ),
      'total_revenue', (
        SELECT COALESCE(SUM(total), 0) FROM orders 
        WHERE DATE(created_at AT TIME ZONE 'America/Tijuana') BETWEEN p_start_date AND p_end_date 
        AND status != 'cancelled'
      ),
      'average_order_value', (
        SELECT COALESCE(AVG(total), 0) FROM orders 
        WHERE DATE(created_at AT TIME ZONE 'America/Tijuana') BETWEEN p_start_date AND p_end_date 
        AND status != 'cancelled'
      ),
      'total_customers', (
        SELECT COUNT(DISTINCT COALESCE(user_id::text, guest_email)) 
        FROM orders 
        WHERE DATE(created_at AT TIME ZONE 'America/Tijuana') BETWEEN p_start_date AND p_end_date
      )
    ),
    
    -- Ventas por día
    'daily_sales', (
      SELECT COALESCE(json_agg(ds.* ORDER BY ds.sale_date DESC), '[]'::json)
      FROM daily_sales_summary ds
      WHERE ds.sale_date BETWEEN p_start_date AND p_end_date
    ),
    
    -- Top productos
    'top_products', (
      SELECT COALESCE(json_agg(tp.* ORDER BY tp.units_sold DESC), '[]'::json)
      FROM (
        SELECT * FROM top_selling_products 
        WHERE popularity_rank <= 10
      ) tp
    ),
    
    -- Rendimiento por categoría
    'category_performance', (
      SELECT COALESCE(json_agg(cp.* ORDER BY cp.revenue DESC), '[]'::json)
      FROM category_performance cp
    ),
    
    -- Órdenes recientes
    'recent_orders', (
      SELECT COALESCE(json_agg(ro.* ORDER BY ro.created_at DESC), '[]'::json)
      FROM (
        SELECT 
          id,
          order_number,
          COALESCE(guest_name, p.full_name) as customer_name,
          order_type,
          total,
          status,
          created_at
        FROM orders o
        LEFT JOIN profiles p ON o.user_id = p.id
        WHERE DATE(o.created_at AT TIME ZONE 'America/Tijuana') BETWEEN p_start_date AND p_end_date
        ORDER BY o.created_at DESC
        LIMIT 20
      ) ro
    ),
    
    -- Estadísticas de estado
    'order_status_breakdown', (
      SELECT json_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE DATE(created_at AT TIME ZONE 'America/Tijuana') BETWEEN p_start_date AND p_end_date
        GROUP BY status
      ) s
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Reporte de ventas detallado
CREATE OR REPLACE FUNCTION get_sales_report(
  p_start_date date,
  p_end_date date,
  p_group_by text DEFAULT 'day' -- 'day', 'week', 'month'
)
RETURNS TABLE (
  period text,
  orders_count bigint,
  items_sold numeric,
  gross_sales numeric,
  net_sales numeric,
  avg_order_value numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN p_group_by = 'day' THEN TO_CHAR(o.created_at AT TIME ZONE 'America/Tijuana', 'YYYY-MM-DD')
      WHEN p_group_by = 'week' THEN TO_CHAR(DATE_TRUNC('week', o.created_at AT TIME ZONE 'America/Tijuana'), 'YYYY-MM-DD')
      WHEN p_group_by = 'month' THEN TO_CHAR(DATE_TRUNC('month', o.created_at AT TIME ZONE 'America/Tijuana'), 'YYYY-MM')
    END as period,
    COUNT(DISTINCT o.id) as orders_count,
    COALESCE(SUM(oi.quantity), 0) as items_sold,
    COALESCE(SUM(o.subtotal), 0) as gross_sales,
    COALESCE(SUM(o.total), 0) as net_sales,
    COALESCE(AVG(o.total), 0) as avg_order_value
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE DATE(o.created_at AT TIME ZONE 'America/Tijuana') BETWEEN p_start_date AND p_end_date
    AND o.status != 'cancelled'
  GROUP BY 1
  ORDER BY 1 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Análisis de horas pico
CREATE OR REPLACE FUNCTION get_peak_hours_analysis(
  p_days_back integer DEFAULT 30
)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'hour', hour,
        'day_of_week', day_of_week,
        'orders_count', orders_count,
        'avg_order_value', avg_order_value
      ) ORDER BY day_of_week, hour
    )
    FROM (
      SELECT 
        EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Tijuana') as hour,
        EXTRACT(DOW FROM created_at AT TIME ZONE 'America/Tijuana') as day_of_week,
        COUNT(*) as orders_count,
        AVG(total) as avg_order_value
      FROM orders
      WHERE created_at >= CURRENT_TIMESTAMP - (p_days_back || ' days')::interval
        AND status != 'cancelled'
      GROUP BY 1, 2
    ) peak_hours
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Análisis de clientes
CREATE OR REPLACE FUNCTION get_customer_analytics()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'customer_segments', (
      SELECT json_agg(segment)
      FROM (
        SELECT 
          CASE 
            WHEN order_count >= 10 THEN 'VIP'
            WHEN order_count >= 5 THEN 'Regular'
            WHEN order_count >= 2 THEN 'Returning'
            ELSE 'New'
          END as segment,
          COUNT(*) as customers,
          AVG(total_spent) as avg_lifetime_value
        FROM (
          SELECT 
            COALESCE(user_id::text, guest_email) as customer_id,
            COUNT(*) as order_count,
            SUM(total) as total_spent
          FROM orders
          WHERE status != 'cancelled'
          GROUP BY 1
        ) customer_orders
        GROUP BY 1
        ORDER BY 
          CASE segment
            WHEN 'VIP' THEN 1
            WHEN 'Regular' THEN 2
            WHEN 'Returning' THEN 3
            ELSE 4
          END
      ) segments
    ),
    'top_customers', (
      SELECT json_agg(tc)
      FROM (
        SELECT 
          COALESCE(guest_name, p.full_name, guest_email) as name,
          COUNT(*) as total_orders,
          SUM(o.total) as total_spent,
          MAX(o.created_at) as last_order_date
        FROM orders o
        LEFT JOIN profiles p ON o.user_id = p.id
        WHERE o.status != 'cancelled'
        GROUP BY COALESCE(o.user_id::text, o.guest_email), 
                 COALESCE(guest_name, p.full_name, guest_email)
        ORDER BY total_spent DESC
        LIMIT 20
      ) tc
    ),
    'retention_metrics', json_build_object(
      'repeat_customer_rate', (
        SELECT 
          ROUND(
            COUNT(CASE WHEN order_count > 1 THEN 1 END)::numeric / 
            NULLIF(COUNT(*), 0) * 100, 
            2
          )
        FROM (
          SELECT 
            COALESCE(user_id::text, guest_email) as customer_id,
            COUNT(*) as order_count
          FROM orders
          GROUP BY 1
        ) co
      ),
      'avg_orders_per_customer', (
        SELECT ROUND(AVG(order_count), 2)
        FROM (
          SELECT 
            COALESCE(user_id::text, guest_email) as customer_id,
            COUNT(*) as order_count
          FROM orders
          GROUP BY 1
        ) co
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ==========================================

-- Índices básicos para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created ON order_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Índices compuestos para queries específicas
CREATE INDEX IF NOT EXISTS idx_orders_user_lookup 
ON orders(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_guest_lookup 
ON orders(guest_email, created_at DESC) 
WHERE guest_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_sales_analysis 
ON orders(created_at DESC, status) 
WHERE status != 'cancelled';

-- ==========================================
-- POLÍTICAS RLS PARA LAS VISTAS Y FUNCIONES
-- ==========================================

-- Permisos para funciones
GRANT EXECUTE ON FUNCTION get_user_orders TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_peak_hours_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_analytics TO authenticated;

-- ==========================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ==========================================

COMMENT ON FUNCTION get_user_orders IS 'Obtiene el historial de órdenes de un usuario por ID o email';
COMMENT ON FUNCTION get_user_stats IS 'Obtiene estadísticas y métricas de un usuario específico';
COMMENT ON FUNCTION get_admin_dashboard IS 'Retorna datos completos para el dashboard administrativo';
COMMENT ON FUNCTION get_sales_report IS 'Genera reporte de ventas agrupado por día, semana o mes';
COMMENT ON FUNCTION get_peak_hours_analysis IS 'Analiza las horas pico de órdenes para optimizar operaciones';
COMMENT ON FUNCTION get_customer_analytics IS 'Análisis detallado de clientes y segmentación';

COMMENT ON VIEW user_order_history IS 'Vista del historial de órdenes con resumen de productos';
COMMENT ON VIEW order_full_details IS 'Vista detallada de órdenes con todos los items';
COMMENT ON VIEW daily_sales_summary IS 'Resumen de ventas agrupado por día';
COMMENT ON VIEW top_selling_products IS 'Productos más vendidos con métricas';
COMMENT ON VIEW category_performance IS 'Rendimiento de ventas por categoría';

-- ==========================================
-- FUNCIÓN PARA OBTENER ÓRDENES POR EMAIL
-- ==========================================

CREATE OR REPLACE FUNCTION get_orders_by_email(
  p_email text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS json AS $$
DECLARE
  v_result json;
  v_current_email text;
BEGIN
  -- Validar que se proporcione un email
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email es requerido',
      'orders', '[]'::json,
      'total_orders', 0
    );
  END IF;

  -- SEGURIDAD: Verificar permisos
  -- 1. Si el email buscado es el de DEMO, permitir acceso a cualquiera
  -- 2. Si no es demo, requerir que el usuario esté autenticado Y que el email coincida con su token
  v_current_email := auth.jwt() ->> 'email';
  
  IF p_email != 'demo@rajma.com' THEN
    IF auth.uid() IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Acceso denegado: Inicie sesión para ver sus órdenes privadas',
        'orders', '[]'::json,
        'total_orders', 0
      );
    ELSIF v_current_email IS NULL OR v_current_email != p_email THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Acceso denegado: No puede ver el historial de otro usuario',
        'orders', '[]'::json,
        'total_orders', 0
      );
    END IF;
  END IF;

  -- Obtener las órdenes
  WITH user_orders AS (
    SELECT 
      o.id,
      o.order_number,
      o.created_at,
      o.order_type,
      o.delivery_address,
      o.status,
      o.payment_method,
      o.payment_status,
      o.total,
      o.subtotal,
      o.tax_amount,
      o.delivery_fee,
      o.tip_amount,
      o.guest_name,
      o.guest_email,
      o.guest_phone,
      o.estimated_time,
      -- Contar items
      COUNT(DISTINCT oi.id) as items_count,
      -- Total de productos
      COALESCE(SUM(oi.quantity), 0) as total_items,
      -- Resumen de productos
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal,
            'image', p.image_url
          )
        ) FILTER (WHERE oi.id IS NOT NULL), 
        '[]'::json
      ) as items_detail
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.guest_email = p_email
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT json_build_object(
    'success', true,
    'email', p_email,
    'orders', COALESCE(json_agg(
      json_build_object(
        'id', id,
        'order_number', order_number,
        'created_at', created_at,
        'order_type', order_type,
        'delivery_address', delivery_address,
        'status', status,
        'payment_method', payment_method,
        'payment_status', payment_status,
        'total', total,
        'subtotal', subtotal,
        'tax_amount', tax_amount,
        'delivery_fee', delivery_fee,
        'tip_amount', tip_amount,
        'guest_name', guest_name,
        'guest_phone', guest_phone,
        'estimated_time', estimated_time,
        'items_count', items_count,
        'total_items', total_items,
        'items', items_detail
      )
    ), '[]'::json),
    'total_orders', (
      SELECT COUNT(*) 
      FROM orders 
      WHERE guest_email = p_email
    ),
    'summary', (
      SELECT json_build_object(
        'total_spent', COALESCE(SUM(total), 0),
        'average_order', COALESCE(AVG(total), 0),
        'first_order', MIN(created_at),
        'last_order', MAX(created_at)
      )
      FROM orders 
      WHERE guest_email = p_email
        AND status != 'cancelled'
    )
  ) INTO v_result
  FROM user_orders;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_orders_by_email TO anon, authenticated;

-- ==========================================
-- FUNCIÓN SIMPLIFICADA (SOLO ÓRDENES)
-- ==========================================

CREATE OR REPLACE FUNCTION get_orders_simple(p_email text)
RETURNS TABLE (
  id uuid,
  order_number text,
  created_at timestamptz,
  order_type text,
  status text,
  total numeric,
  items_count bigint,
  guest_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.created_at,
    o.order_type,
    o.status,
    o.total,
    COUNT(oi.id) as items_count,
    o.guest_name
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE o.guest_email = p_email
  GROUP BY o.id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_orders_simple TO anon, authenticated;

-- ==========================================
-- FUNCIÓN PARA BUSCAR POR MÚLTIPLES CAMPOS
-- ==========================================

CREATE OR REPLACE FUNCTION search_orders(
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_order_number text DEFAULT NULL
)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'orders', COALESCE(json_agg(
        json_build_object(
          'id', o.id,
          'order_number', o.order_number,
          'created_at', o.created_at,
          'status', o.status,
          'total', o.total,
          'guest_name', o.guest_name,
          'guest_email', o.guest_email,
          'order_type', o.order_type
        ) ORDER BY o.created_at DESC
      ), '[]'::json)
    )
    FROM orders o
    WHERE 
      (p_email IS NOT NULL AND o.guest_email = p_email)
      OR 
      (p_phone IS NOT NULL AND o.guest_phone = p_phone)
      OR 
      (p_order_number IS NOT NULL AND o.order_number = p_order_number)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_orders TO anon, authenticated;

-- ==========================================
-- FIN DEL SCRIPT
-- ==========================================