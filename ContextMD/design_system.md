I'll enhance your design system to better capture Apple's design philosophy. Here's an improved version:

```markdown
# Design System & UI/UX Guidelines - Apple Design Language

## 🎨 Core Design Philosophy

### Fundamental Principles
- **Clarity:** Content is king. Every pixel serves a purpose.
- **Deference:** The UI steps back and lets content shine.
- **Depth:** Layer elements to create hierarchy and focus.
- **Negative Space:** Generous whitespace creates breathing room.
- **Intentionality:** Every interaction has meaning and purpose.

## 🎨 Visual Language

### Glassmorphism & Materials
- **Background Blur:** `backdrop-filter: blur(20px)` with `background: rgba(255,255,255,0.7)`
- **Vibrancy:** Semi-transparent overlays that allow content to show through
- **Elevation:** 
  - Level 0: Base content
  - Level 1: Cards `shadow-sm` + subtle border
  - Level 2: Floating elements `shadow-lg` + stronger blur
  - Level 3: Modals/Sheets with full backdrop

### Motion Principles
- **Natural Physics:** Spring animations with realistic tension and friction
- **Responsive:** 0.5-0.8s duration for major transitions
- **Interruptible:** Users can stop/reverse any animation
- **Contextual:** Motion reinforces spatial relationships

```css
/* Example Spring Animation */
transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## 🖍️ Design Tokens

### Color System

```css
/* Primary Palette - True Apple Inspiration */
--primary-black: #000000;
--primary-white: #FFFFFF;
--primary-gray-01: #FBFBFD; /* Background */
--primary-gray-02: #F5F5F7; /* Secondary Background */
--primary-gray-03: #E8E8ED; /* Borders */
--primary-gray-04: #D2D2D7; /* Disabled */
--primary-gray-05: #86868B; /* Secondary Text */
--primary-gray-06: #515154; /* Icons */
--primary-gray-07: #1D1D1F; /* Primary Text */

/* Accent Colors */
--accent-blue: #0071E3; /* Primary Actions */
--accent-blue-hover: #0051D5;
--accent-green: #34C759; /* Success/WhatsApp */
--accent-red: #FF3B30; /* Errors/Remove */
--accent-orange: #FF9500; /* Warnings */
--accent-purple: #AF52DE; /* Special/Premium */

/* Semantic Colors */
--interactive: var(--accent-blue);
--interactive-hover: var(--accent-blue-hover);
--success: var(--accent-green);
--danger: var(--accent-red);
--warning: var(--accent-orange);

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  --primary-bg: #000000;
  --secondary-bg: #1C1C1E;
  --tertiary-bg: #2C2C2E;
  /* ... additional dark mode colors */
}
```

### Typography Scale

```css
/* Font Families */
--font-display: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
--font-text: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
--font-mono: 'SF Mono', Consolas, monospace;

/* Type Scale - Using Apple's Approach */
--text-xs: 11px;     /* Caption 2 */
--text-sm: 13px;     /* Caption 1 */
--text-base: 15px;   /* Body */
--text-md: 17px;     /* Body Large */
--text-lg: 20px;     /* Title 3 */
--text-xl: 24px;     /* Title 2 */
--text-2xl: 28px;    /* Title 1 */
--text-3xl: 34px;    /* Large Title */
--text-4xl: 48px;    /* Display */
--text-5xl: 64px;    /* Display Large */

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Letter Spacing (Tracking) */
--tracking-tight: -0.022em;  /* Headlines */
--tracking-normal: -0.016em; /* Body */
--tracking-wide: 0.009em;    /* Captions */

/* Line Heights */
--leading-tight: 1.2;   /* Headlines */
--leading-normal: 1.5;  /* Body text */
--leading-relaxed: 1.7; /* Long-form content */
```

### Spacing System (8pt Grid)

```css
/* Base unit: 4px for micro-adjustments, 8px for standard spacing */
--space-0: 0;
--space-1: 4px;   /* Micro spacing */
--space-2: 8px;   /* Tight spacing */
--space-3: 12px;  /* Compact spacing */
--space-4: 16px;  /* Default spacing */
--space-5: 20px;  /* Comfortable spacing */
--space-6: 24px;  /* Relaxed spacing */
--space-8: 32px;  /* Section spacing */
--space-10: 40px; /* Large spacing */
--space-12: 48px; /* Extra large spacing */
--space-16: 64px; /* Huge spacing */
--space-20: 80px; /* Massive spacing */
```

### Layout & Breakpoints

```css
/* Container Widths */
--container-xs: 375px;  /* iPhone SE */
--container-sm: 640px;  /* Small tablets */
--container-md: 768px;  /* iPad Portrait */
--container-lg: 1024px; /* iPad Landscape */
--container-xl: 1280px; /* Desktop */
--container-2xl: 1536px; /* Large Desktop */

/* Safe Areas (for mobile) */
--safe-area-inset-top: env(safe-area-inset-top);
--safe-area-inset-bottom: env(safe-area-inset-bottom);
```

## 🧩 Component Specifications

### Buttons

```jsx
/* Primary Button */
.btn-primary {
  background: var(--accent-blue);
  color: white;
  padding: 12px 24px;
  border-radius: 980px; /* Pill shape */
  font-weight: 500;
  font-size: 17px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background: var(--accent-blue-hover);
  transform: scale(0.98);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--accent-blue);
  border: 1.5px solid var(--primary-gray-03);
}
```

### Cards & Surfaces

```jsx
/* Product Card */
.product-card {
  background: var(--primary-white);
  border-radius: 18px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--primary-gray-03);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
}

/* Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
}
```

### Navigation & Headers

```jsx
/* Sticky Header */
.header-sticky {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(251, 251, 253, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
}

/* Navigation Items */
.nav-item {
  color: var(--primary-gray-07);
  font-weight: 400;
  transition: color 0.2s ease;
}

.nav-item:hover {
  color: var(--accent-blue);
}
```

### Form Elements

```jsx
/* Input Fields */
.input-field {
  background: var(--primary-gray-02);
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 16px; /* Prevents zoom on mobile */
  transition: all 0.2s ease;
}

.input-field:focus {
  background: var(--primary-white);
  border-color: var(--accent-blue);
  outline: none;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}
```

### Floating Elements

```jsx
/* WhatsApp Button */
.whatsapp-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  background: var(--accent-green);
  border-radius: 30px;
  box-shadow: 
    0 4px 12px rgba(52, 199, 89, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.whatsapp-float:hover {
  transform: scale(1.1);
  box-shadow: 
    0 6px 20px rgba(52, 199, 89, 0.5),
    0 3px 6px rgba(0, 0, 0, 0.1);
}

/* Pulse animation when cart has items */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(52, 199, 89, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
}

.whatsapp-float.has-items {
  animation: pulse 2s infinite;
}
```

### Modals & Sheets

```jsx
/* Modal Backdrop */
.modal-backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Sheet (Slide-up on mobile) */
.sheet-content {
  background: var(--primary-white);
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

## 📱 Responsive Considerations

### Mobile-First Approach
```css
/* Base styles for mobile */
.container {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding-left: var(--space-8);
    padding-right: var(--space-8);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: var(--container-xl);
    margin: 0 auto;
  }
}
```

### Touch Targets
- Minimum touch target: 44x44px (Apple HIG)
- Add padding rather than sizing elements exactly 44px
- Ensure adequate spacing between interactive elements

## 🎯 Implementation Checklist

- [ ] Use SF Pro or system fonts exclusively
- [ ] Implement 8pt spacing grid
- [ ] Add subtle animations with spring physics
- [ ] Use glass morphism for floating elements
- [ ] Ensure all interactive elements have hover/active states
- [ ] Test on actual iOS devices for authentic feel
- [ ] Implement proper dark mode support
- [ ] Use semantic color variables, not hard-coded values
- [ ] Ensure touch targets meet 44px minimum
- [ ] Add haptic feedback triggers for mobile interactions

## 🚀 Advanced Techniques

### Micro-Interactions
- Button press: Scale to 0.95 with spring-back
- Card hover: Subtle lift with shadow
- Loading states: Skeleton screens with shimmer
- Success states: Check mark draw animation

### Performance
- Use `will-change` sparingly for animated elements
- Implement `prefers-reduced-motion` media query
- Lazy load images with blur-up technique
- Use CSS containment for better paint performance
```
