-- Tabla para notificaciones de invitados
CREATE TABLE IF NOT EXISTS public.guest_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_guest_notifications_email ON public.guest_notifications(email);
CREATE INDEX IF NOT EXISTS idx_guest_notifications_order_id ON public.guest_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_guest_notifications_created_at ON public.guest_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.guest_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Los invitados pueden ver sus notificaciones por email
-- NOTE: In a real app, this should be stricter, but for now we allow SELECT if email matches in query
CREATE POLICY "Guests can view their notifications by email"
  ON public.guest_notifications FOR SELECT
  USING (true);

-- Vista para simplificar queries desde el frontend
CREATE OR REPLACE VIEW public.v_all_notifications AS
SELECT 
  n.id,
  n.order_id,
  n.user_id,
  NULL::text as email,
  n.title,
  n.message,
  n.is_read,
  n.created_at,
  'user'::text as notification_type
FROM public.notifications n

UNION ALL

SELECT 
  gn.id,
  gn.order_id,
  NULL::uuid as user_id,
  gn.email,
  gn.title,
  gn.message,
  gn.is_read,
  gn.created_at,
  'guest'::text as notification_type
FROM public.guest_notifications gn;

-- Grant access
GRANT SELECT ON public.v_all_notifications TO authenticated, anon;

-- Función para obtener todas las notificaciones (registrados + guests)
CREATE OR REPLACE FUNCTION get_all_notifications(p_email text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  order_id uuid,
  order_number text,
  title text,
  message text,
  is_read boolean,
  created_at timestamptz,
  notification_type text
) AS $$
BEGIN
  -- Si hay usuario autenticado
  IF auth.uid() IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      n.id,
      n.order_id,
      o.order_number,
      n.title,
      n.message,
      n.is_read,
      n.created_at,
      'user'::text as notification_type
    FROM notifications n
    JOIN orders o ON o.id = n.order_id
    WHERE n.user_id = auth.uid()
    UNION ALL
    -- También incluir notificaciones de guest si el email coincide
    SELECT 
      gn.id,
      gn.order_id,
      o.order_number,
      gn.title,
      gn.message,
      gn.is_read,
      gn.created_at,
      'guest'::text as notification_type
    FROM guest_notifications gn
    JOIN orders o ON o.id = gn.order_id
    WHERE gn.email = auth.email()
    ORDER BY created_at DESC;
    
  -- Si solo se proporciona email (usuario no autenticado)
  ELSIF p_email IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      gn.id,
      gn.order_id,
      o.order_number,
      gn.title,
      gn.message,
      gn.is_read,
      gn.created_at,
      'guest'::text as notification_type
    FROM guest_notifications gn
    JOIN orders o ON o.id = gn.order_id
    WHERE gn.email = p_email
    ORDER BY created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id uuid,
  p_notification_type text,
  p_email text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_updated boolean := false;
BEGIN
  IF p_notification_type = 'user' AND auth.uid() IS NOT NULL THEN
    UPDATE notifications 
    SET is_read = true 
    WHERE id = p_notification_id AND user_id = auth.uid();
    v_updated := FOUND;
    
  ELSIF p_notification_type = 'guest' AND p_email IS NOT NULL THEN
    UPDATE guest_notifications 
    SET is_read = true 
    WHERE id = p_notification_id AND email = p_email;
    v_updated := FOUND;
  END IF;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function Updated
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_title text := 'Actualización de Orden';
  v_notification_message text;
BEGIN
  -- Solo proceder si el status cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Construir mensaje
    -- COALESCE order_number in case it's null (it shouldn't be but safety)
    v_notification_message := format('Tu orden %s ha cambiado a %s', 
                                   COALESCE(NEW.order_number::text, 'ND'), 
                                   NEW.status);
    
    -- Detectar tipo de usuario y enrutar a la tabla correcta
    IF NEW.user_id IS NOT NULL THEN
      -- Usuario registrado -> tabla notifications
      INSERT INTO public.notifications (user_id, order_id, title, message)
      VALUES (NEW.user_id, NEW.id, v_notification_title, v_notification_message);
      
    ELSIF NEW.guest_email IS NOT NULL THEN -- Changed from customer_email to guest_email to match schema
      -- Usuario invitado -> tabla guest_notifications
      INSERT INTO public.guest_notifications (email, order_id, title, message)
      VALUES (NEW.guest_email, NEW.id, v_notification_title, v_notification_message);
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_order_status_update ON public.orders;
CREATE TRIGGER on_order_status_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_change();
