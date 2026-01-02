"use client"

import { ThemeProvider } from "@/lib/hooks/useTheme"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    )
}
