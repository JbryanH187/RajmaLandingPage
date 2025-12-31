-- Fix for "column reference 'user_id' is ambiguous" error
-- STRATEGY: Keep the parameter name as 'user_id' to avoid breaking dependencies (signature remains the same),
-- but assign it to a distinct variable internally to assume unambiguous usage in queries.

CREATE OR REPLACE FUNCTION public.has_permission(user_id uuid, resource_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_granted boolean;
    -- Capture parameter in a distinct variable to avoid column name collisions
    v_param_user_id uuid := user_id;
BEGIN
    SELECT granted INTO v_granted
    FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.user_id = v_param_user_id
      AND p.resource = resource_name
      AND p.action = action_name;
      
    IF v_granted IS NOT NULL THEN
        RETURN v_granted;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.role_permissions rp
        JOIN public.permissions p ON p.id = rp.permission_id
        JOIN public.profiles prof ON prof.role_id = rp.role_id
        WHERE prof.id = v_param_user_id
          AND p.resource = resource_name
          AND p.action = action_name
    );
END;
$$;
