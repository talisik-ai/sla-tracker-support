import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import axios from 'axios'

const JIRA_BASE_URL = process.env.VITE_JIRA_INSTANCE_URL
const JIRA_EMAIL = process.env.VITE_JIRA_EMAIL
const JIRA_API_TOKEN = process.env.VITE_JIRA_API_TOKEN

// Server-side base64 encoding for Node.js
const authHeader = JIRA_API_TOKEN && JIRA_EMAIL
  ? `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`
  : ''

export const Route = createFileRoute('/api/jira/issue/$issueKey/changelog')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        console.log('[Server Proxy] Received request for changelog:', params.issueKey)

        // Check if credentials are configured
        if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
          console.error('[Server Proxy] Missing Jira credentials')
          return json(
            { error: 'Jira credentials not configured on server' },
            { status: 500 }
          )
        }

        const { issueKey } = params

        if (!issueKey) {
          return json(
            { error: 'Issue key is required' },
            { status: 400 }
          )
        }

        console.log('[Server Proxy] Fetching changelog for issue:', issueKey)

        try {
          // Request changelog from Jira API
          const response = await axios.get(
            `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/changelog`,
            {
              headers: {
                'Authorization': authHeader,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          )

          console.log(`[Server Proxy] Successfully fetched changelog for ${issueKey}`)

          // Return the changelog data to the client
          return json(response.data)
        } catch (error: any) {
          console.error('[Server Proxy] Jira Changelog API Error:', error.message)
          if (error.response) {
            console.error('[Server Proxy] Error response:', {
              status: error.response.status,
              data: JSON.stringify(error.response.data).substring(0, 200),
            })
          }

          return json(
            {
              error: 'Failed to fetch changelog from Jira API',
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
