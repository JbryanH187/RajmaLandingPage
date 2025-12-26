-- ==========================================
-- RAJMA SUSHI - SEED DATA (INITIAL MENU)
-- ==========================================

-- 1. Ensure Categories Exist
INSERT INTO categories (id, label, sort_order) VALUES
('entradas', 'Entradas', 1),
('naturales', 'Sushi Natural', 2),
('empanizados', 'Empanizados', 3),
('especiales', 'Especiales y Horneados', 4),
('platillos', 'Platillos y Combos', 5),
('charolas', 'Charolas', 6),
('bebidas', 'Bebidas', 7)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Products
-- We use a CTE (Common Table Expression) or just straightforward inserts.
-- Since UUIDs are auto-generated, we need to handle variants carefully. 
-- For this seed script, we will use specific UUIDs for the products to make linking variants easier.

-- === ENTRADAS ===
INSERT INTO products (id, name, description, price, category_id, is_available, tags, image_url) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tostada de Atún', 'Atún, pepino, aguacate, mango (en temporada), salsa negra.', 70, 'entradas', true, ARRAY['popular'], '/images/products/tostada-atun.jpg'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Tostada Veneno', 'Camarón cocido, pepino, cebolla, salsa de la casa.', 65, 'entradas', true, null, '/images/products/tostada-veneno.jpg'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Chile Relleno', 'Relleno de Philadelphia, tampico y carne a elección.', 95, 'entradas', true, null, '/images/products/chile-relleno.jpg'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Chile Momia', 'Relleno de Philadelphia, tampico y carne, envuelto en tocino.', 105, 'entradas', true, null, '/images/products/chile-momia.jpg'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Camarones Roca', null, 105, 'entradas', true, null, '/images/products/camarones-roca.jpg');

-- Variants for Chile Relleno
INSERT INTO product_variants (product_id, name, price) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Orden (3 pzas)', 95),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Individual (1 pza)', 35);

-- Variants for Chile Momia
INSERT INTO product_variants (product_id, name, price) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Orden (3 pzas)', 105),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Individual (1 pza)', 40);


-- === NATURALES ===
INSERT INTO products (id, name, description, price, category_id, is_available, tags, image_url) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Campechano', 'Camarón y atún por dentro, Togarashi por fuera.', 105, 'naturales', true, ARRAY['spicy'], '/images/products/campechano.jpg'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Aguachile', 'Bañado en salsa especial Rajma.', 115, 'naturales', true, ARRAY['popular'], '/images/products/aguachile.jpg'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Icha Roll', 'Camarón empanizado + topping de camarón picosito.', 100, 'naturales', true, ARRAY['spicy'], '/images/products/icha-roll.jpg');


-- === EMPANIZADOS ===
INSERT INTO products (id, name, description, price, category_id, is_available, tags, image_url) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'Cielo, Mar y Tierra', null, 95, 'empanizados', true, null, '/images/products/cielo-mar-tierra.jpg'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'Sinnombre', 'Pollo frito BBQ, cebollín, salsa de anguila.', 103, 'empanizados', true, null, '/images/products/sinnombre.jpg'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'Prali', 'Res/Tocino con topping de camarón empanizado picosito.', 110, 'empanizados', true, null, '/images/products/prali.jpg'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 'Dedos Roll', 'Topping de dedos de queso.', 103, 'empanizados', true, null, '/images/products/dedos-roll.jpg');


-- === ESPECIALES ===
INSERT INTO products (id, name, description, price, category_id, is_available, tags, image_url) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'Dragon', null, 100, 'especiales', true, null, '/images/products/dragon.jpg'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'Innombrable', null, 135, 'especiales', true, null, '/images/products/innombrable.jpg'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'Rajma Roll', null, 135, 'especiales', true, ARRAY['popular'], '/images/products/rajma-roll.jpg'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'Horneado Lava', null, 125, 'especiales', true, null, '/images/products/horneado-lava.jpg');


-- === PLATILLOS ===
INSERT INTO products (id, name, description, price, category_id, is_available, tags, image_url) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'Yakimeshi / Gohan', null, 70, 'platillos', true, null, '/images/products/yakimeshi.jpg'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e12', 'Bombas de Arroz', null, 90, 'platillos', true, null, '/images/products/bombas.jpg'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', 'Combo pa 2', 'Guamuchilito + Volcán + 1 Rollito + 1 Chile Relleno + Té.', 295, 'platillos', true, null, '/images/products/combo-2.jpg');

-- Variants for Yakimeshi
INSERT INTO product_variants (product_id, name, price) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'Sencillo', 70),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'Especial', 110);


-- === CHAROLAS ===
INSERT INTO products (id, name, description, price, category_id, is_available, tags, image_url) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'Charola Clásica', null, 315, 'charolas', true, null, '/images/products/charola-classic.jpg'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'Charola Gratinada', null, 365, 'charolas', true, null, '/images/products/charola-gratinada.jpg');

-- Variants for Charolas
INSERT INTO product_variants (product_id, name, price) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', '50 Piezas', 315),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', '70 Piezas', 455),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', '50 Piezas', 365),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', '70 Piezas', 535);
