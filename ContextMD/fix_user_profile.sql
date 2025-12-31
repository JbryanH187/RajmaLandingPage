-- Fix Missing Profile for User 3716b0f4-c181-4b0a-afea-f227ba971e97

-- 1. Ensure 'customer' role exists
INSERT INTO public.roles (name, description)
VALUES ('customer', 'System customer')
ON CONFLICT (name) DO NOTHING;

-- 2. Manually Create Profile
DO $$
DECLARE
    v_role_id uuid;
    v_user_id uuid := 'fcac215f-d04b-4ff9-bc82-8a80b19852d0'; -- The ID from your logs
    v_email text := 'your_email@gmail.com'; -- Replace if needed, but we can query it
BEGIN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'customer';
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

    INSERT INTO public.profiles (id, email, full_name, role_id)
    VALUES (
        v_user_id,
        v_email,
        'New User', -- Placeholder
        v_role_id
    )
    ON CONFLICT (id) DO UPDATE SET
        role_id = EXCLUDED.role_id;
        
    RAISE NOTICE 'Fixed profile for user %', v_user_id;
END $$;
