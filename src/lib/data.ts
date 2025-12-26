import { Category, Product } from '@/types';

export const CATEGORIES: Category[] = [
    { id: 'entradas', label: 'Entradas' },
    { id: 'naturales', label: 'Sushi Natural' },
    { id: 'empanizados', label: 'Empanizados' },
    { id: 'especiales', label: 'Especiales y Horneados' },
    { id: 'platillos', label: 'Platillos y Combos' },
    { id: 'charolas', label: 'Charolas' },
];

export const PRODUCTS: Product[] = [
    // --- Entradas ---
    {
        id: 'tostada-atun',
        name: 'Tostada de Atún',
        description: 'Atún, pepino, aguacate, mango (en temporada), salsa negra.',
        price: 70,
        category: 'entradas',
        tags: ['popular'],
        isAvailable: true,
    },
    {
        id: 'tostada-veneno',
        name: 'Tostada Veneno',
        description: 'Camarón cocido, pepino, cebolla, salsa de la casa.',
        price: 65,
        category: 'entradas',
        isAvailable: true,
    },
    {
        id: 'chile-relleno',
        name: 'Chile Relleno',
        description: 'Relleno de Philadelphia, tampico y carne a elección.',
        price: 95,
        category: 'entradas',
        isAvailable: true,
        variants: [
            { id: '3pc', name: 'Orden (3 pzas)', price: 95 },
            { id: '1pc', name: 'Individual (1 pza)', price: 35 },
        ]
    },
    {
        id: 'chile-momia',
        name: 'Chile Momia',
        description: 'Relleno de Philadelphia, tampico y carne, envuelto en tocino.',
        price: 105,
        category: 'entradas',
        isAvailable: true,
        variants: [
            { id: '3pc', name: 'Orden (3 pzas)', price: 105 },
            { id: '1pc', name: 'Individual (1 pza)', price: 40 },
        ]
    },
    {
        id: 'camarones-roca',
        name: 'Camarones Roca',
        price: 105,
        category: 'entradas',
        isAvailable: true,
    },

    // --- Naturales ---
    {
        id: 'campechano',
        name: 'Campechano',
        description: 'Camarón y atún por dentro, Togarashi por fuera.',
        price: 105,
        category: 'naturales',
        tags: ['spicy'],
        isAvailable: true,
    },
    {
        id: 'aguachile-roll',
        name: 'Aguachile',
        description: 'Bañado en salsa especial Rajma.',
        price: 115,
        category: 'naturales',
        tags: ['popular'],
        isAvailable: true,
    },
    {
        id: 'icha-roll',
        name: 'Icha Roll',
        description: 'Camarón empanizado + topping de camarón picosito.',
        price: 100,
        category: 'naturales',
        tags: ['spicy'],
        isAvailable: true,
    },

    // --- Empanizados ---
    {
        id: 'cielo-mar-tierra',
        name: 'Cielo, Mar y Tierra',
        price: 95,
        category: 'empanizados',
        isAvailable: true,
    },
    {
        id: 'sinnombre',
        name: 'Sinnombre',
        description: 'Pollo frito BBQ, cebollín, salsa de anguila.',
        price: 103,
        category: 'empanizados',
        isAvailable: true,
    },
    {
        id: 'prali',
        name: 'Prali',
        description: 'Res/Tocino con topping de camarón empanizado picosito.',
        price: 110,
        category: 'empanizados',
        isAvailable: true,
    },
    {
        id: 'dedos-roll',
        name: 'Dedos Roll',
        description: 'Topping de dedos de queso.',
        price: 103,
        category: 'empanizados',
        isAvailable: true,
    },

    // --- Especiales ---
    {
        id: 'dragon',
        name: 'Dragon',
        price: 100,
        category: 'especiales',
        isAvailable: true,
    },
    {
        id: 'innombrable',
        name: 'Innombrable',
        price: 135,
        category: 'especiales',
        isAvailable: true,
    },
    {
        id: 'rajma-roll',
        name: 'Rajma Roll',
        price: 135,
        category: 'especiales',
        tags: ['popular'],
        isAvailable: true,
    },
    {
        id: 'horneado-lava',
        name: 'Horneado Lava',
        price: 125,
        category: 'especiales',
        isAvailable: true,
    },

    // --- Platillos ---
    {
        id: 'yakimeshi',
        name: 'Yakimeshi / Gohan',
        price: 70, // Base price, might need variants
        category: 'platillos',
        isAvailable: true,
        variants: [
            { id: 'sencillo', name: 'Sencillo', price: 70 },
            { id: 'especial', name: 'Especial', price: 110 }
        ]
    },
    {
        id: 'bomba-arroz',
        name: 'Bombas de Arroz',
        price: 90,
        category: 'platillos',
        isAvailable: true,
    },
    {
        id: 'combo-2',
        name: 'Combo pa 2',
        description: 'Guamuchilito + Volcán + 1 Rollito + 1 Chile Relleno + Té.',
        price: 295,
        category: 'platillos',
        isAvailable: true,
    },

    // --- Charolas ---
    {
        id: 'charola-classic',
        name: 'Charola Clásica',
        price: 315,
        category: 'charolas',
        isAvailable: true,
        variants: [
            { id: '50pcs', name: '50 Piezas', price: 315 },
            { id: '70pcs', name: '70 Piezas', price: 455 },
        ]
    },
    {
        id: 'charola-gratinada',
        name: 'Charola Gratinada',
        price: 365,
        category: 'charolas',
        isAvailable: true,
        variants: [
            { id: '50pcs', name: '50 Piezas', price: 365 },
            { id: '70pcs', name: '70 Piezas', price: 535 },
        ]
    }
];
