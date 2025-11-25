import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/health')({
    component: () => null,
    server: {
        handlers: {
            GET: async () => {
                return json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: process.env.npm_package_version || '1.0.0',
                    environment: process.env.NODE_ENV || 'development'
                })
            }
        }
    }
})

