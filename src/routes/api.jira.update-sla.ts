import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import axios from 'axios'

// Helper to get environment variables at runtime
// This is critical for serverless environments like Vercel
function getEnvVars() {
    const JIRA_BASE_URL = process.env.JIRA_INSTANCE_URL || process.env.VITE_JIRA_INSTANCE_URL
    const JIRA_EMAIL = process.env.JIRA_EMAIL || process.env.VITE_JIRA_EMAIL
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || process.env.VITE_JIRA_API_TOKEN
    const FIELD_SLA_DUE_DATE = process.env.JIRA_CUSTOM_FIELD_SLA_DUE_DATE || process.env.VITE_JIRA_CUSTOM_FIELD_SLA_DUE_DATE
    const FIELD_SLA_STATUS = process.env.JIRA_CUSTOM_FIELD_SLA_STATUS || process.env.VITE_JIRA_CUSTOM_FIELD_SLA_STATUS
    const FIELD_SLA_TIME_USED = process.env.JIRA_CUSTOM_FIELD_SLA_TIME_USED || process.env.VITE_JIRA_CUSTOM_FIELD_SLA_TIME_USED
    
    return { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, FIELD_SLA_DUE_DATE, FIELD_SLA_STATUS, FIELD_SLA_TIME_USED }
}

export const Route = createFileRoute('/api/jira/update-sla')({
    component: () => null,
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const body = await request.json()
                    const { issueKey, slaData } = body

                    // Read environment variables at RUNTIME (not module load time)
                    const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, FIELD_SLA_DUE_DATE, FIELD_SLA_STATUS, FIELD_SLA_TIME_USED } = getEnvVars()

                    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
                        console.error('[SLA Sync] Missing Jira credentials')
                        return json(
                            { success: false, error: 'Jira credentials not configured' },
                            { status: 500 }
                        )
                    }

                    if (!FIELD_SLA_DUE_DATE || !FIELD_SLA_STATUS || !FIELD_SLA_TIME_USED) {
                        console.error('[SLA Sync] Missing custom field configuration')
                        return json(
                            {
                                success: false,
                                error: 'Jira custom fields not configured. See docs/jira-custom-fields-setup.md'
                            },
                            { status: 500 }
                        )
                    }

                    console.log(`[SLA Sync] Syncing SLA data for issue: ${issueKey}`)

                    // Prepare custom field updates
                    const fields: Record<string, any> = {}

                    // SLA Due Date (ISO 8601 format)
                    if (slaData.dueDate) {
                        fields[FIELD_SLA_DUE_DATE] = slaData.dueDate
                    }

                    // SLA Status
                    if (slaData.status) {
                        fields[FIELD_SLA_STATUS] = { value: slaData.status }
                    }

                    // SLA Time Used %
                    if (slaData.timeUsedPercent !== undefined) {
                        fields[FIELD_SLA_TIME_USED] = Math.round(slaData.timeUsedPercent)
                    }

                    // Update Jira issue
                    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')

                    await axios.put(
                        `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`,
                        { fields },
                        {
                            headers: {
                                'Authorization': `Basic ${auth}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    )

                    console.log(`[SLA Sync] Successfully synced issue ${issueKey}`)

                    return json(
                        {
                            success: true,
                            issueKey,
                            syncedAt: new Date().toISOString()
                        },
                        { status: 200 }
                    )

                } catch (error: any) {
                    console.error('[SLA Sync] Error syncing to Jira:', error.response?.data || error.message)

                    return json(
                        {
                            success: false,
                            error: error.response?.data?.errorMessages?.[0] || error.message
                        },
                        { status: 500 }
                    )
                }
            }
        }
    }
})
