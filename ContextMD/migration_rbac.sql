-- RBAC System Migration V2.2
-- Fix: Reverted RPC parameter names to 'user_id' etc. to avoid Drop/Cascade issues.

-- 1. Prerequisites
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables (Idempotent)
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource text NOT NULL,
    action text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted boolean DEFAULT true,
    granted_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.modules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    route text NOT NULL,
    icon text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_modules (
    role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
    module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
    can_access boolean DEFAULT true,
    PRIMARY KEY (role_id, module_id)
);

-- 2. Update Profiles Schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role_id') THEN
        ALTER TABLE public.profiles ADD COLUMN role_id uuid REFERENCES public.roles(id);
    END IF;
END $$;

-- 3. Seed Data
INSERT INTO public.roles (name, description) VALUES
('super_admin', 'Full system access'),
('admin', 'Business administrator'),
('employee', 'Limited access employee'),
('customer', 'System customer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (resource, action, description) VALUES
('categories', 'create', 'Create categories'),
('categories', 'delete', 'Delete categories'),
('categories', 'read',   'View categories'),
('categories', 'update', 'Update categories'),
('orders',     'create', 'Create orders'),
('orders',     'delete', 'Delete orders'),
('orders',     'read',   'View orders'),
('orders',     'update', 'Update orders'),
('products',   'create', 'Create products'),
('products',   'delete', 'Delete products'),
('products',   'read',   'View products'),
('products',   'update', 'Update products'),
('storage',    'delete', 'Delete files'),
('storage',    'update', 'Update files'),
('storage',    'upload', 'Upload files'),
('users',      'create', 'Create users'),
('users',      'read',   'View users'),
('users',      'update', 'Update users'),
('users',      'delete', 'Delete users'),
('reports',    'read',   'View reports'),
('settings',   'read',   'View settings'),
('settings',   'update', 'Update settings'),
('kds',        'read',   'View Kitchen Display System'),
('kds',        'update', 'Update KDS orders'),
('permissions', 'read',   'View permissions'),
('permissions', 'grant',  'Grant permissions'),
('permissions', 'revoke', 'Revoke permissions'),
('roles',       'read',   'View roles'),
('roles',       'assign', 'Assign roles'),
('roles',       'create', 'Create roles'),
('roles',       'update', 'Update roles'),
('roles',       'delete', 'Delete roles')
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO public.modules (name, display_name, route, order_index) VALUES
('dashboard', 'Dashboard', '/admin', 1),
('products',  'Menú',      '/admin/menu', 2),
('orders',    'Pedidos',   '/admin/orders', 3),
('kds',       'Cocina (KDS)', '/admin/kds', 4),
('users',     'Usuarios',  '/admin/users', 5),
('reports',   'Reportes',  '/admin/reports', 6),
('settings',  'Configuración', '/admin/settings', 7)
ON CONFLICT (name) DO NOTHING;

-- Permissions Assignments
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p 
WHERE r.name = 'admin' AND (
    p.resource NOT IN ('permissions', 'roles') 
    OR (p.resource = 'permissions' AND p.action IN ('read', 'grant', 'revoke'))
    OR (p.resource = 'roles' AND p.action IN ('read', 'assign'))
)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON
    (p.resource = 'orders' AND p.action IN ('read', 'update')) OR
    (p.resource = 'kds' AND p.action IN ('read', 'update'))
WHERE r.name = 'employee'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON
    (p.resource = 'orders' AND p.action IN ('create', 'read')) OR
    (p.resource = 'products' AND p.action = 'read') OR
    (p.resource = 'categories' AND p.action = 'read')
WHERE r.name = 'customer'
ON CONFLICT DO NOTHING;

-- Module Assignments
INSERT INTO public.role_modules (role_id, module_id)
SELECT r.id, m.id FROM public.roles r CROSS JOIN public.modules m WHERE r.name IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_modules (role_id, module_id)
SELECT r.id, m.id FROM public.roles r JOIN public.modules m ON m.name IN ('kds', 'orders') WHERE r.name = 'employee'
ON CONFLICT DO NOTHING;


-- 4. FIXES: Trigger for New Messages and User Registration Logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Look up role_id for customer
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'customer';

  -- Fail-safe execution with error logging
  BEGIN
      -- 1. Try to find 'customer' role by name
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'customer' LIMIT 1;
      
      -- 2. Fallback to specific known UUID if name lookup failed
      IF v_role_id IS NULL THEN
         -- Check if this specific ID exists (from previous dumps)
         SELECT id INTO v_role_id FROM public.roles WHERE id = '110affc9-2cff-41ed-a40b-210893dafcd2';
      END IF;

      -- 3. Self-healing: Create customer role if still missing
      IF v_role_id IS NULL THEN
        INSERT INTO public.roles (name, description)
        VALUES ('customer', 'System customer')
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_role_id;
        
        -- Final safety check
        IF v_role_id IS NULL THEN
            SELECT id INTO v_role_id FROM public.roles WHERE name = 'customer';
        END IF;
      END IF;

      INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url, 
        role_id,
        updated_at
      )
      VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
        v_role_id,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        role_id = COALESCE(public.profiles.role_id, v_role_id),
        updated_at = NOW();
        
  EXCEPTION WHEN OTHERS THEN
      -- CRITICAL: Log error and propagate success so user is created
      RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 5. RPC Functions (Using 'user_id' instead of 'p_user_id' to match existing signature)

-- [FIX] Robust get_user_auth_info with LEFT JOIN
DROP FUNCTION IF EXISTS public.get_user_auth_info(uuid);
CREATE OR REPLACE FUNCTION public.get_user_auth_info(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_info json;
    v_permissions json;
    v_modules json;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'role', CASE WHEN r.id IS NOT NULL THEN json_build_object(
            'id', r.id,
            'name', r.name,
            'description', r.description
        ) ELSE NULL END
    ) INTO v_user_info
    FROM public.profiles p
    LEFT JOIN public.roles r ON r.id = p.role_id
    WHERE p.id = p_user_id;

    SELECT json_agg(json_build_array(resource, action, granted))
    INTO v_permissions
    FROM (
        SELECT 
            p.resource, 
            p.action,
            COALESCE(up.granted, true) as granted
        FROM public.profiles prof
        JOIN public.role_permissions rp ON rp.role_id = prof.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        LEFT JOIN public.user_permissions up ON up.permission_id = p.id AND up.user_id = p_user_id
        WHERE prof.id = p_user_id
        
        UNION ALL
        
        SELECT 
            p.resource, 
            p.action,
            up.granted
        FROM public.user_permissions up
        JOIN public.permissions p ON p.id = up.permission_id
        WHERE up.user_id = p_user_id
          AND up.granted = true
          AND p.id NOT IN (
              SELECT permission_id 
              FROM public.role_permissions rp 
              JOIN public.profiles prof ON prof.role_id = rp.role_id 
              WHERE prof.id = p_user_id
          )
    ) perm;

    SELECT json_agg(json_build_object(
        'name', m.name,
        'display_name', m.display_name,
        'route', m.route,
        'icon', m.icon
    ))
    INTO v_modules
    FROM (
        SELECT m.*
        FROM public.modules m
        JOIN public.role_modules rm ON rm.module_id = m.id
        JOIN public.profiles p ON p.role_id = rm.role_id
        WHERE p.id = p_user_id
        ORDER BY m.order_index
    ) m;

    RETURN json_build_object(
        'user', v_user_info,
        'permissions', COALESCE(v_permissions, '[]'::json),
        'modules', COALESCE(v_modules, '[]'::json)
    );
END;
$$;

-- Helper: public.has_permission (Original signature: user_id, resource_name, action_name)
-- Helper: public.has_permission (Original signature: user_id, resource_name, action_name)
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id uuid, resource_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_granted boolean;
BEGIN
    SELECT granted INTO v_granted
    FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.user_id = p_user_id
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
        WHERE prof.id = p_user_id
          AND p.resource = resource_name
          AND p.action = action_name
    );
END;
$$;

-- RLS Policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
        DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
        DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
        
        CREATE POLICY "Users can create orders" ON public.orders FOR INSERT
        WITH CHECK (
            auth.uid() IS NOT NULL AND (
                (SELECT has_permission(auth.uid(), 'orders', 'create')) = true
            )
        );

        CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT
        USING (
            auth.uid() = user_id
        );

        CREATE POLICY "Staff can view all orders" ON public.orders FOR SELECT
        USING (
            (SELECT has_permission(auth.uid(), 'orders', 'read')) = true
        );
    END IF;
END $$;
