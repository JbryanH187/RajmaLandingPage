"use client"

import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'rajma_device_fingerprint'

interface DeviceInfo {
    userAgent: string
    screenResolution: string
    timezone: string
    language: string
    platform: string
}

export function useDeviceFingerprint() {
    const [fingerprint, setFingerprint] = useState<string | null>(null)
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        // 1. Get or Create Fingerprint UUID
        let storedFingerprint = localStorage.getItem(STORAGE_KEY)
        if (!storedFingerprint) {
            storedFingerprint = uuidv4()
            localStorage.setItem(STORAGE_KEY, storedFingerprint)
        }
        setFingerprint(storedFingerprint)

        // 2. Gather Device Info
        const info: DeviceInfo = {
            userAgent: window.navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: window.navigator.language,
            platform: window.navigator.platform
        }
        setDeviceInfo(info)

    }, [])

    return { fingerprint, deviceInfo }
}
