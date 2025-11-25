import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import axios from 'axios'

export const Route = createFileRoute('/api/jira/search')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                console.log('[Server Proxy] Received request for Jira search')

                // For Vercel/Nitro, we need to use VITE_ prefixed env vars
                // because they are the ones that get bundled at build time
                // Non-VITE prefixed vars are not available in the serverless runtime
                const JIRA_BASE_URL = process.env.VITE_JIRA_INSTANCE_URL
                const JIRA_EMAIL = process.env.VITE_JIRA_EMAIL
                const JIRA_API_TOKEN = process.env.VITE_JIRA_API_TOKEN
                const PROJECT_KEY = process.env.VITE_JIRA_PROJECT_KEY || 'SAL'

                // Debug: Log which env vars are available (without exposing values)
                console.log('[Server Proxy] Environment check:', {
                    hasJiraUrl: !!JIRA_BASE_URL,
                    hasEmail: !!JIRA_EMAIL,
                    hasToken: !!JIRA_API_TOKEN,
                    hasProjectKey: !!PROJECT_KEY,
                    jiraUrlPrefix: JIRA_BASE_URL ? JIRA_BASE_URL.substring(0, 30) + '...' : 'MISSING',
                })

                // Check if credentials are configured
                if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
                    console.error('[Server Proxy] Missing credentials:', {
                        hasUrl: !!JIRA_BASE_URL,
                        hasEmail: !!JIRA_EMAIL,
                        hasToken: !!JIRA_API_TOKEN
                    })
                    return json(
                        { error: 'Jira credentials not configured on server' },
                        { status: 500 }
                    )
                }

                // Create auth header
                const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`

                // Parse query parameters from the request URL
                const url = new URL(request.url)
                const jql = url.searchParams.get('jql') || `project = "${PROJECT_KEY}" ORDER BY created DESC`
                const fields = url.searchParams.get('fields') || 'summary,description,status,priority,issuetype,assignee,reporter,created,updated,resolutiondate,components,labels,comment'
                const maxResults = parseInt(url.searchParams.get('maxResults') || '100')
                const startAt = parseInt(url.searchParams.get('startAt') || '0')

                console.log('[Server Proxy] Forwarding request to Jira:', {
                    url: `${JIRA_BASE_URL}/rest/api/3/search/jql`,
                    jql,
                    maxResults
                })

                try {
                    // Make the request to Jira API from the server using the new /search/jql endpoint
                    const response = await axios.get(
                        `${JIRA_BASE_URL}/rest/api/3/search/jql`,
                        {
                            params: {
                                jql,
                                fields,
                                maxResults,
                                startAt,
                                expand: 'changelog',
                            },
                            headers: {
                                'Authorization': authHeader,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },
                            timeout: 30000,
                        }
                    )

                    console.log(`[Server Proxy] Success! Received ${response.data.issues?.length || 0} issues from Jira`)
                    if (response.data.issues?.length > 0) {
                        console.log('[Server Proxy] First Issue Status:', JSON.stringify(response.data.issues[0].fields.status, null, 2))
                        console.log('[Server Proxy] First Issue Resolution Date:', response.data.issues[0].fields.resolutiondate)
                    }

                    // Return the Jira API response to the client
                    return json(response.data)
                } catch (error: any) {
                    console.error('[Server Proxy] Jira API Error:', error.message)
                    if (error.response) {
                        console.error('[Server Proxy] Error response:', {
                            status: error.response.status,
                            data: JSON.stringify(error.response.data).substring(0, 500),
                        })
                    }

                    return json(
                        {
                            error: 'Failed to fetch from Jira API',
                            details: error.message,
                            status: error.response?.status,
                        },
                        { status: error.response?.status || 500 }
                    )
                }
            },
        },
    },
})
