# Product Specifications: Restaurant Digital Menu

## 📱 Core Features

### 1. Hero Section
- **Elements:** High-res Hero Image, Elegant Typography for Name, Tagline.
- **Logic:** "Open/Closed" indicator based on current time vs. config.
- **CTA:** Smooth scroll to Menu section.

### 2. Digital Menu (The Core)
- **Navigation:** Sticky category bar. Active state highlights automatically on scroll (Intersection Observer).
- **Filtering:** Filter by: Veggie, Gluten-Free, Spicy.
- **Search:** Real-time search by name/ingredient.
- **Detail View:** Modal with "Add to Cart", Ingredients, Allergens.

### 3. WhatsApp Ordering System (The Engine)
- **Cart Logic:**
  - LocalStorage persistence.
  - Add/Remove items.
  - Calculate Subtotal.
- **WhatsApp Generation:**
  - On checkout, construct a formatted string:
    `"Hola! Quisiera pedir: \n- 2x Tacos Pastor ($120)\n- 1x Coca Cola ($25)\nTotal: $145"`
  - Open `wa.me` link with encoded text.

### 4. About & Info
- **Map:** Google Maps Embed (grayscale/styled to match UI).
- **Hours:** Highlight "Today".

## 🛠️ Data Model (TypeScript Interfaces)

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags: ('vegan' | 'spicy' | 'new')[];
  allergens: string[];
  isAvailable: boolean;
}

interface CartItem extends Product {
  quantity: number;
  notes?: string; // "Sin cebolla"
}