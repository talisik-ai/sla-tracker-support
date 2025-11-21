// Jira Custom Field Configuration
// These IDs should match the custom fields created in your Jira instance
// See docs/jira-custom-fields-setup.md for setup instructions

export const JIRA_CUSTOM_FIELDS = {
    SLA_DUE_DATE: import.meta.env.VITE_JIRA_CUSTOM_FIELD_SLA_DUE_DATE || 'customfield_10050',
    SLA_STATUS: import.meta.env.VITE_JIRA_CUSTOM_FIELD_SLA_STATUS || 'customfield_10051',
    SLA_TIME_USED: import.meta.env.VITE_JIRA_CUSTOM_FIELD_SLA_TIME_USED || 'customfield_10052',
} as const

// Validate that custom fields are configured
export function validateCustomFieldsConfigured(): boolean {
    const hasEnvVars = !!(
        import.meta.env.VITE_JIRA_CUSTOM_FIELD_SLA_DUE_DATE &&
        import.meta.env.VITE_JIRA_CUSTOM_FIELD_SLA_STATUS &&
        import.meta.env.VITE_JIRA_CUSTOM_FIELD_SLA_TIME_USED
    )

    if (!hasEnvVars) {
        console.warn('⚠️ Jira custom fields not configured. Sync to Jira will not work.')
        console.warn('See docs/jira-custom-fields-setup.md for instructions.')
    }

    return hasEnvVars
}

// Map SLA status to Jira field values
export function mapSLAStatus(status: 'on-track' | 'at-risk' | 'breached' | 'met'): string {
    const statusMap = {
        'on-track': 'On Track',
        'at-risk': 'At Risk',
        'breached': 'Breached',
        'met': 'Met',
    }
    return statusMap[status]
}
