# Rajma Sushi Digital Menu

A premium, minimalist digital menu and ordering system for **Rajma Sushi**, designed with an **Apple-inspired "Editorial" aesthetic** and built for performance on the Next.js framework. It features a stunning full-screen hero section, magazine-style product cards, and smooth, refined interactions.

![Rajma Sushi Hero](public/hero-image.jpg)

## Features

- **Editorial Design**: Full-screen immersive layout with generous whitespace, elegant typography, and subtle animations.
- **Dynamic Menu Grid**: Filter products by category or search by ingredients with a gallery-style interface.
- **Smart Cart**: Manage your order with real-time totals and customization options.
- **WhatsApp Checkout**: Automatically generates a formatted order message to send directly to the restaurant.
- **Product Customization**: Select variants (e.g., quantity per order) and add kitchen notes.
- **Operational Logic**: "Open/Closed" status indicator based on real business hours.
- **Responsive Design**: Mobile-first approach, optimized for all devices with native-app feel.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/ui](https://ui.shadcn.com/)
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/rajma-sushi-menu.git
    cd rajma-sushi-menu
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

To create an optimized production build:

```bash
npm run build
```

This command generates the `.next` folder with your static and server-side assets.

## Running Tests

To run the automated test suite (Unit & Integration):

```bash
npm run test
```

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  Vercel will detect Next.js and configure the build settings automatically.
4.  Click **Deploy**.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── features/     # Feature-specific components (Menu, Cart, Hero)
│   ├── layout/       # Header, Footer
│   └── ui/           # Shadcn generic UI components
├── lib/              # Utilities and Data
│   ├── store/        # Zustand state management
│   └── data.ts       # Menu data source
└── types/            # TypeScript strict definitions
```

## License

This project is open source and available under the [MIT License](LICENSE).
