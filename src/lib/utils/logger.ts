type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
    level: LogLevel
    message: string
    timestamp: number
    context?: Record<string, any>
}

class Logger {
    private isDev = process.env.NODE_ENV === 'development'
    private logs: LogEntry[] = []
    private maxLogs = 100

    private log(level: LogLevel, message: string, context?: Record<string, any>) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: Date.now(),
            context
        }

        // Store in memory for debugging
        this.logs.push(entry)
        if (this.logs.length > this.maxLogs) {
            this.logs.shift()
        }

        // Only show in console in development
        if (this.isDev) {
            const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
            const prefix = `[${level.toUpperCase()}]`
            console[method](prefix, message, context || '')
        }

        // In production, send errors to monitoring service
        if (!this.isDev && (level === 'error' || level === 'warn')) {
            this.sendToMonitoring(entry)
        }
    }

    private sendToMonitoring(entry: LogEntry) {
        // Integrate with Sentry, LogRocket, etc.
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'exception', {
                description: entry.message,
                fatal: entry.level === 'error'
            })
        }
    }

    debug(message: string, context?: Record<string, any>) {
        this.log('debug', message, context)
    }

    info(message: string, context?: Record<string, any>) {
        this.log('info', message, context)
    }

    warn(message: string, context?: Record<string, any>) {
        this.log('warn', message, context)
    }

    error(message: string, context?: Record<string, any>) {
        this.log('error', message, context)
    }

    // Useful for debugging in production
    getLogs(): LogEntry[] {
        return [...this.logs]
    }

    // Clear stored logs
    clearLogs() {
        this.logs = []
    }
}

export const logger = new Logger()

// Usage:
// import { logger } from '@/lib/utils/logger'
// logger.debug('[AuthListener] Session initialized')
// logger.error('[AuthListener] Failed to fetch profile', { userId })
