import { logger } from './logger'

interface PerformanceMetric {
    name: string
    value: number
    timestamp?: number
    tags?: Record<string, string>
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = []
    private threshold = {
        query: 1000,  // 1s
        auth: 2000,   // 2s
        api: 800,     // 800ms
        realtime: 500 // 500ms
    }
    private maxMetrics = 100

    track(metric: PerformanceMetric) {
        const entry = { ...metric, timestamp: Date.now() }
        this.metrics.push(entry)

        // Alert if exceeds threshold
        const type = metric.tags?.type as keyof typeof this.threshold
        const threshold = this.threshold[type] || 1000

        if (metric.value > threshold) {
            this.alert(metric, threshold)
        }

        // Keep only last N metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift()
        }
    }

    private alert(metric: PerformanceMetric, threshold: number) {
        logger.warn('Performance threshold exceeded', {
            metric: metric.name,
            value: `${metric.value.toFixed(2)}ms`,
            threshold: `${threshold}ms`,
            tags: metric.tags
        })
    }

    // Track a query with timing
    async trackQuery<T>(name: string, queryFn: () => Promise<T>): Promise<T> {
        const startTime = performance.now()

        try {
            const result = await queryFn()
            const duration = performance.now() - startTime

            this.track({
                name,
                value: duration,
                tags: { type: 'query' }
            })

            return result
        } catch (error) {
            const duration = performance.now() - startTime
            this.track({
                name: `${name}:error`,
                value: duration,
                tags: { type: 'query', error: 'true' }
            })
            throw error
        }
    }

    getMetrics() {
        return {
            total: this.metrics.length,
            averages: this.calculateAverages(),
            slowQueries: this.metrics.filter(m =>
                m.value > (this.threshold[m.tags?.type as keyof typeof this.threshold] || 1000)
            )
        }
    }

    private calculateAverages(): Record<string, number> {
        const grouped = this.metrics.reduce((acc, metric) => {
            if (!acc[metric.name]) acc[metric.name] = []
            acc[metric.name].push(metric.value)
            return acc
        }, {} as Record<string, number[]>)

        return Object.entries(grouped).reduce((acc, [name, values]) => {
            acc[name] = values.reduce((a, b) => a + b, 0) / values.length
            return acc
        }, {} as Record<string, number>)
    }

    clearMetrics() {
        this.metrics = []
    }
}

export const performanceMonitor = new PerformanceMonitor()

// Usage:
// import { performanceMonitor } from '@/lib/utils/performance-monitor'
//
// // Track manually:
// performanceMonitor.track({ name: 'fetchProfile', value: 150, tags: { type: 'query' } })
//
// // Or wrap a query:
// const data = await performanceMonitor.trackQuery('fetchPosts', async () => {
//   return await supabase.from('posts').select('*')
// })
