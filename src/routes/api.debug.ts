import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/debug')({
    component: () => null,
    server: {
        handlers: {
            GET: async () => {
                // Check which environment variables are set (without exposing values)
                // Note: VITE_ prefixed vars are baked in at build time
                const envCheck = {
                    // VITE_ prefixed (available - baked at build time)
                    VITE_JIRA_INSTANCE_URL: !!process.env.VITE_JIRA_INSTANCE_URL,
                    VITE_JIRA_EMAIL: !!process.env.VITE_JIRA_EMAIL,
                    VITE_JIRA_API_TOKEN: !!process.env.VITE_JIRA_API_TOKEN,
                    VITE_JIRA_PROJECT_KEY: !!process.env.VITE_JIRA_PROJECT_KEY,
                    
                    // Show partial URL for debugging (first 30 chars)
                    jiraUrlPreview: (process.env.VITE_JIRA_INSTANCE_URL || 'NOT_SET').substring(0, 30),
                    
                    // Node environment
                    NODE_ENV: process.env.NODE_ENV,
                }
                
                return json({
                    status: 'debug',
                    timestamp: new Date().toISOString(),
                    environment: envCheck,
                    note: 'VITE_ prefixed vars are baked in at build time. If false, you need to rebuild after setting env vars.'
                })
            }
        }
    }
})
