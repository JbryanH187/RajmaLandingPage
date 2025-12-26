# Project Rules & Steering Instructions

## 🛑 NON-NEGOTIABLE GUIDELINES
1.  **Strict Adherence:** You must strictly follow the defined Tech Stack and Folder Structure. Do not invent new libraries unless explicitly asked.
2.  **Design Philosophy:** All UI MUST follow "Apple Human Interface Guidelines": Simplicity, Clarity, and Deference. Minimalist, premium feel.
3.  **Code Quality:**
    - Use TypeScript Strict Mode. No `any`.
    - Functional Components only.
    - Shadcn/ui for base components.
    - Tailwind CSS for styling (utility-first).
4.  **Performance:** Always prioritize Core Web Vitals (LCP, CLS). Use `next/image` and lazy loading by default.

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/ui
- **State:** Zustand (cart/preferences) + React Query (server state)
- **Animation:** Framer Motion (complex) + CSS/Tailwind (simple)

### Backend Logic
- **CMS:** Sanity.io / Strapi (Headless)
- **DB:** Supabase (PostgreSQL) + Redis (Caching)
- **Functions:** Vercel Edge Functions
- **Images:** Cloudinary (Auto-optimization)

### Folder Structure
Strictly follow this tree:
```text
src/
├── app/                  # Next.js App Router
├── components/
│   ├── ui/               # Atomic Shadcn components
│   ├── features/         # Business logic components (Menu, Cart, Hero)
│   └── layout/           # Structural components (Header, Footer)
├── lib/
│   ├── hooks/            # Global custom hooks
│   ├── utils/            # Helper functions
│   └── store/            # Zustand stores
├── services/             # API calls & External integrations (WhatsApp)
└── types/                # Global TypeScript definitions