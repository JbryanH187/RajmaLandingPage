"use client"

import { useRealtimeOrder } from "@/lib/hooks/useRealtimeOrder"

export function OrderTracker() {
    // This component has no UI. Its only job is to keep the 
    // real-time connection and polling alive globally.
    useRealtimeOrder()
    return null
}
