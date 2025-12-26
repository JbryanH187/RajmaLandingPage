-- ==========================================
-- RAJMA SUSHI - SUPABASE DATABASE SCHEMA
-- ==========================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. USERS & PROFILES (Authentication)
-- ==========================================

-- Table: profiles
-- Linked 1:1 with auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text unique not null,
  role text default 'customer' check (role in ('customer', 'admin', 'super_admin')),
  full_name text,
  avatar_url text,
  phone text,
  default_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Trigger: Handle New User Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 3. MENU SYSTEM (Products & Categories)
-- ==========================================

-- Table: categories (Lookup table for hardcoded types)
create table public.categories (
    id text primary key, -- 'entradas', 'naturales', etc.
    label text not null,
    sort_order int default 0
);

-- Seed Categories (Based on Typescript types)
insert into categories (id, label, sort_order) values
('entradas', 'Entradas', 1),
('naturales', 'Sushi Natural', 2),
('empanizados', 'Empanizados', 3),
('especiales', 'Especiales y Horneados', 4),
('platillos', 'Platillos y Combos', 5),
('charolas', 'Charolas', 6),
('bebidas', 'Bebidas', 7)
on conflict (id) do nothing;

-- Table: products
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price decimal(10,2) not null,
  category_id text references categories(id),
  image_url text,
  tags text[], -- Array like ['popular', 'spicy']
  is_available boolean default true,
  created_at timestamp with time zone default now()
);

-- Table: product_variants (For "3 piezas" vs "Orden", etc)
create table public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade,
  name text not null,
  price decimal(10,2) not null
);

-- RLS: Products (Read public, Write Admin only)
alter table products enable row level security;

create policy "Menu is viewable by everyone" on products
  for select using (true);

create policy "Admins can insert products" on products
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Admins can update products" on products
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Admins can delete products" on products
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );


-- ==========================================
-- 4. ORDERS (Admin Dashboard)
-- ==========================================

create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  total decimal(10,2) not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  items jsonb not null, -- Snapshot of cart: [{name, price, qty, variant...}]
  delivery_address text,
  contact_phone text,
  notes text,
  created_at timestamp with time zone default now()
);

-- RLS: Orders
alter table orders enable row level security;

create policy "Users can view their own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Users can create orders" on orders
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all orders" on orders
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Admins can update order status" on orders
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );


-- ==========================================
-- 5. STORAGE (Images)
-- ==========================================

-- Note: You must create a public bucket named 'menu-images' in the dashboard first.

-- Policy: Anyone can view images
-- (This usually needs to be added via the Dashboard Storage Policy Editor, but SQL representation:)
-- create policy "Menu Images are public" on storage.objects for select using ( bucket_id = 'menu-images' );

-- Policy: Admins can upload
-- create policy "Admins can upload menu images" on storage.objects for insert with check (
--   bucket_id = 'menu-images' and 
--   exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
-- ); 


CREATE POLICY "Menu Images are public" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Admins can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'menu-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update menu images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'menu-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete menu images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'menu-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Resolve some stuff in base a suggerences by supabase 

-- Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Crear políticas para categories
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert categories" 
ON public.categories FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only admins can update categories" 
ON public.categories FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only admins can delete categories" 
ON public.categories FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage product variants" 
ON public.product_variants FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Eliminar la función existente
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

  -- ==========================================
-- RAJMA SUSHI - SUPABASE DATABASE SCHEMA
-- ==========================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. USERS & PROFILES (Authentication)
-- ==========================================

-- Table: profiles
-- Linked 1:1 with auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text unique not null,
  role text default 'customer' check (role in ('customer', 'admin', 'super_admin')),
  full_name text,
  avatar_url text,
  phone text,
  default_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Trigger: Handle New User Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 3. MENU SYSTEM (Products & Categories)
-- ==========================================

-- Table: categories (Lookup table for hardcoded types)
create table public.categories (
    id text primary key, -- 'entradas', 'naturales', etc.
    label text not null,
    sort_order int default 0
);

-- Seed Categories (Based on Typescript types)
insert into categories (id, label, sort_order) values
('entradas', 'Entradas', 1),
('naturales', 'Sushi Natural', 2),
('empanizados', 'Empanizados', 3),
('especiales', 'Especiales y Horneados', 4),
('platillos', 'Platillos y Combos', 5),
('charolas', 'Charolas', 6),
('bebidas', 'Bebidas', 7)
on conflict (id) do nothing;

-- Table: products
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price decimal(10,2) not null,
  category_id text references categories(id),
  image_url text,
  tags text[], -- Array like ['popular', 'spicy']
  is_available boolean default true,
  created_at timestamp with time zone default now()
);

-- Table: product_variants (For "3 piezas" vs "Orden", etc)
create table public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade,
  name text not null,
  price decimal(10,2) not null
);

-- RLS: Products (Read public, Write Admin only)
alter table products enable row level security;

create policy "Menu is viewable by everyone" on products
  for select using (true);

create policy "Admins can insert products" on products
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Admins can update products" on products
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Admins can delete products" on products
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );


-- ==========================================
-- 4. ORDERS (Admin Dashboard)
-- ==========================================

create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  total decimal(10,2) not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  items jsonb not null, -- Snapshot of cart: [{name, price, qty, variant...}]
  delivery_address text,
  contact_phone text,
  notes text,
  created_at timestamp with time zone default now()
);

-- RLS: Orders
alter table orders enable row level security;

create policy "Users can view their own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Users can create orders" on orders
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all orders" on orders
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );

create policy "Admins can update order status" on orders
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );


-- ==========================================
-- 5. STORAGE (Images)
-- ==========================================

-- Note: You must create a public bucket named 'menu-images' in the dashboard first.

-- Policy: Anyone can view images
-- (This usually needs to be added via the Dashboard Storage Policy Editor, but SQL representation:)
-- create policy "Menu Images are public" on storage.objects for select using ( bucket_id = 'menu-images' );

-- Policy: Admins can upload
-- create policy "Admins can upload menu images" on storage.objects for insert with check (
--   bucket_id = 'menu-images' and 
--   exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
-- ); 


CREATE POLICY "Menu Images are public" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Admins can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'menu-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update menu images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'menu-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete menu images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'menu-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Resolve some stuff in base a suggerences by supabase 

-- Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Crear políticas para categories
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert categories" 
ON public.categories FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only admins can update categories" 
ON public.categories FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only admins can delete categories" 
ON public.categories FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage product variants" 
ON public.product_variants FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Eliminar la función existente
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();