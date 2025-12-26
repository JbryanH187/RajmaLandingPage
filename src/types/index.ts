export type CategoryId = 'entradas' | 'naturales' | 'empanizados' | 'especiales' | 'platillos' | 'charolas' | 'bebidas';

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: CategoryId;
    image?: string;
    tags?: ('popular' | 'spicy' | 'vegetarian' | 'new')[]; // 'popular' inferred from "Veneno/Roca" etc
    allergens?: string[];
    isAvailable: boolean;
    minItems?: number; // For "Charolas" (50/70 pcs handling?) -> Actually charolas are variants?
    variants?: {
        id: string;
        name: string; // e.g. "3 piezas", "1 pieza", "50 piezas"
        price: number;
    }[];
}

export interface CartItem extends Product {
    cartId: string; // Unique ID for cart entry (to handle same product with different notes)
    quantity: number;
    selectedVariantId?: string; // If product has variants
    notes?: string;
}

export interface Category {
    id: CategoryId;
    label: string;
    description?: string;
}
