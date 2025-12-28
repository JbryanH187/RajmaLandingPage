-- RPC: get_dashboard_stats
-- Returns consolidated metrics for the Admin Dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_date DATE DEFAULT CURRENT_DATE,
  p_timezone TEXT DEFAULT 'America/Mexico_City'  -- Para Sinaloa
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_sales numeric;
  v_total_orders integer;
  v_open_orders integer;
  v_orders_last_hour integer;
  v_avg_prep_time interval;
  v_avg_delivery_time interval;
  v_top_items json;
  v_hourly_sales json;
  v_order_status_breakdown json;
  v_payment_method_breakdown json;
  v_cancelled_orders integer;
  v_customer_count integer;
BEGIN
  -- 1. Verify Admin Access
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- 2. Total Sales & Orders Today (in local timezone)
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(*)
  INTO v_total_sales, v_total_orders
  FROM orders
  WHERE status IN ('completed', 'delivered')
    AND created_at AT TIME ZONE p_timezone >= p_date
    AND created_at AT TIME ZONE p_timezone < p_date + INTERVAL '1 day';

  -- 3. Open Orders Count
  SELECT COUNT(*)
  INTO v_open_orders
  FROM orders
  WHERE status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering');

  -- 4. Orders Last Hour
  SELECT COUNT(*)
  INTO v_orders_last_hour
  FROM orders
  WHERE created_at >= (NOW() - INTERVAL '1 hour');

  -- 5. Calculate Real Avg Prep Time (Created -> Ready)
  SELECT 
    AVG(
      CASE 
        WHEN ready_at IS NOT NULL THEN ready_at - created_at
        WHEN preparing_at IS NOT NULL THEN NOW() - created_at  -- Still preparing
        ELSE NULL
      END
    )
  INTO v_avg_prep_time
  FROM orders
  WHERE created_at AT TIME ZONE p_timezone >= p_date
    AND status NOT IN ('cancelled');

  -- 6. Calculate Avg Delivery Time (Ready -> Delivered)
  SELECT 
    AVG(
      CASE 
        WHEN completed_at IS NOT NULL AND ready_at IS NOT NULL 
        THEN completed_at - ready_at
        ELSE NULL
      END
    )
  INTO v_avg_delivery_time
  FROM orders
  WHERE created_at AT TIME ZONE p_timezone >= p_date
    AND order_type = 'delivery'
    AND status = 'delivered';

  -- 7. Top Selling Items Today
  WITH today_items AS (
    SELECT 
      p.id,
      p.name,
      p.image_url,
      SUM(oi.quantity) as total_qty,
      SUM(oi.subtotal) as total_revenue,
      COUNT(DISTINCT oi.order_id) as order_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.created_at AT TIME ZONE p_timezone >= p_date
      AND o.created_at AT TIME ZONE p_timezone < p_date + INTERVAL '1 day'
      AND o.status NOT IN ('cancelled')
    GROUP BY p.id, p.name, p.image_url
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'image_url', image_url,
      'quantity', total_qty,
      'revenue', total_revenue,
      'orders', order_count
    ) ORDER BY total_qty DESC
  )
  INTO v_top_items
  FROM today_items
  LIMIT 5;

  -- 8. Hourly Sales Chart Data
  WITH hours AS (
    SELECT generate_series(0, 23) as hour
  ),
  hourly_data AS (
    SELECT 
      EXTRACT(HOUR FROM created_at AT TIME ZONE p_timezone)::integer as hour,
      COUNT(*) as orders,
      COALESCE(SUM(total), 0) as sales
    FROM orders
    WHERE created_at AT TIME ZONE p_timezone >= p_date
      AND created_at AT TIME ZONE p_timezone < p_date + INTERVAL '1 day'
      AND status IN ('completed', 'delivered')
    GROUP BY hour
  )
  SELECT json_agg(
    json_build_object(
      'hour', h.hour,
      'orders', COALESCE(hd.orders, 0),
      'sales', COALESCE(hd.sales, 0)
    ) ORDER BY h.hour
  )
  INTO v_hourly_sales
  FROM hours h
  LEFT JOIN hourly_data hd ON h.hour = hd.hour;

  -- 9. Order Status Breakdown
  SELECT json_object_agg(status, count)
  INTO v_order_status_breakdown
  FROM (
    SELECT status, COUNT(*) as count
    FROM orders
    WHERE created_at AT TIME ZONE p_timezone >= p_date
      AND created_at AT TIME ZONE p_timezone < p_date + INTERVAL '1 day'
    GROUP BY status
  ) s;

  -- 10. Payment Method Breakdown
  SELECT json_object_agg(payment_method, count)
  INTO v_payment_method_breakdown
  FROM (
    SELECT payment_method, COUNT(*) as count
    FROM orders
    WHERE created_at AT TIME ZONE p_timezone >= p_date
      AND created_at AT TIME ZONE p_timezone < p_date + INTERVAL '1 day'
      AND status NOT IN ('cancelled')
    GROUP BY payment_method
  ) p;

  -- 11. Cancelled Orders Count
  SELECT COUNT(*)
  INTO v_cancelled_orders
  FROM orders
  WHERE created_at AT TIME ZONE p_timezone >= p_date
    AND created_at AT TIME ZONE p_timezone < p_date + INTERVAL '1 day'
    AND status = 'cancelled';

  -- 12. Unique Customers Today
  SELECT COUNT(DISTINCT COALESCE(user_id::text, guest_email))
  INTO v_customer_count
  FROM orders
  WHERE created_at AT TIME ZONE p_timezone >= p_date
    AND created_at AT TIME ZONE p_timezone < p_date + INTERVAL '1 day';

  -- Return comprehensive dashboard data
  RETURN json_build_object(
    'overview', json_build_object(
      'totalSalesToday', v_total_sales,
      'totalOrdersToday', v_total_orders,
      'openOrders', v_open_orders,
      'ordersLastHour', v_orders_last_hour,
      'cancelledToday', v_cancelled_orders,
      'uniqueCustomers', v_customer_count
    ),
    'performance', json_build_object(
      'avgPrepTime', COALESCE(
        EXTRACT(EPOCH FROM v_avg_prep_time) / 60, 
        0
      )::integer, -- minutes
      'avgDeliveryTime', COALESCE(
        EXTRACT(EPOCH FROM v_avg_delivery_time) / 60,
        0
      )::integer -- minutes
    ),
    'topSellingItems', COALESCE(v_top_items, '[]'::json),
    'hourlySales', COALESCE(v_hourly_sales, '[]'::json),
    'orderStatusBreakdown', COALESCE(v_order_status_breakdown, '{}'::json),
    'paymentMethodBreakdown', COALESCE(v_payment_method_breakdown, '{}'::json),
    'lastUpdated', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't expose internal details
  RAISE WARNING 'Dashboard stats error: %', SQLERRM;
  RAISE EXCEPTION 'Error generating dashboard statistics';
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION get_dashboard_stats(DATE, TEXT) TO authenticated;