import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/debug')({
    component: () => null,
    server: {
        handlers: {
            GET: async () => {
                // Check which environment variables are set (without exposing values)
                const envCheck = {
                    // New secure names
                    JIRA_INSTANCE_URL: !!process.env.JIRA_INSTANCE_URL,
                    JIRA_EMAIL: !!process.env.JIRA_EMAIL,
                    JIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN,
                    JIRA_PROJECT_KEY: !!process.env.JIRA_PROJECT_KEY,
                    
                    // Old VITE_ names (fallback)
                    VITE_JIRA_INSTANCE_URL: !!process.env.VITE_JIRA_INSTANCE_URL,
                    VITE_JIRA_EMAIL: !!process.env.VITE_JIRA_EMAIL,
                    VITE_JIRA_API_TOKEN: !!process.env.VITE_JIRA_API_TOKEN,
                    VITE_JIRA_PROJECT_KEY: !!process.env.VITE_JIRA_PROJECT_KEY,
                    
                    // Show partial URL for debugging (first 30 chars)
                    jiraUrlPreview: (process.env.JIRA_INSTANCE_URL || process.env.VITE_JIRA_INSTANCE_URL || 'NOT_SET').substring(0, 30),
                    
                    // Node environment
                    NODE_ENV: process.env.NODE_ENV,
                }
                
                return json({
                    status: 'debug',
                    timestamp: new Date().toISOString(),
                    environment: envCheck,
                    message: 'If all values are false, environment variables are not being passed to the serverless function'
                })
            }
        }
    }
})

