import { useNotificationStore } from '@/lib/notifications/store'
import { SLAData, JiraIssue } from '@/lib/jira/types'
import { formatRemainingTime } from '@/lib/utils/time'
import { SLAEmailData } from '@/lib/email/client'
import axios from 'axios'

/**
 * Check SLA status and trigger notifications if needed
 */
export function checkAndNotify(issue: JiraIssue, sla: SLAData, prevSLA?: SLAData) {
    const { addNotification } = useNotificationStore.getState()

    // Check if status changed to at-risk
    if (sla.isAtRisk && (!prevSLA || !prevSLA.isAtRisk)) {
        const message = `${issue.key} is approaching its SLA deadline (${sla.resolutionPercentageUsed}% time used)`

        // Add in-app notification
        addNotification({
            type: 'warning',
            title: 'SLA At Risk',
            message,
            link: `/issues?search=${issue.key}`
        })

        // Send email notification
        sendEmailNotification(issue, sla, 'at-risk')
    }

    // Check if status changed to breached
    if (sla.isBreached && (!prevSLA || !prevSLA.isBreached)) {
        const message = `${issue.key} has breached its SLA deadline (${sla.resolutionPercentageUsed}% time used)`

        // Add in-app notification
        addNotification({
            type: 'error',
            title: 'SLA Breached',
            message,
            link: `/issues?search=${issue.key}`
        })

        // Send email notification
        sendEmailNotification(issue, sla, 'breached')
    }

    // Check if first response is at risk
    if (!sla.hasFirstResponse && sla.firstResponsePercentageUsed >= 75 && sla.firstResponsePercentageUsed < 100) {
        if (!prevSLA || prevSLA.firstResponsePercentageUsed < 75) {
            addNotification({
                type: 'warning',
                title: 'First Response SLA At Risk',
                message: `${issue.key} needs a first response soon (${sla.firstResponsePercentageUsed}% time used)`,
                link: `/issues?search=${issue.key}`
            })
        }
    }

    // Check if first response is breached
    if (!sla.hasFirstResponse && sla.firstResponsePercentageUsed >= 100) {
        if (!prevSLA || prevSLA.firstResponsePercentageUsed < 100) {
            addNotification({
                type: 'error',
                title: 'First Response SLA Breached',
                message: `${issue.key} has not received a first response within the SLA deadline`,
                link: `/issues?search=${issue.key}`
            })
        }
    }
}

/**
 * Send email notification (async, non-blocking)
 */
async function sendEmailNotification(issue: JiraIssue, sla: SLAData, alertType: 'at-risk' | 'breached') {
    try {
        // Get recipient email (assignee or default)
        const to = process.env.VITE_SLA_ALERT_EMAIL || issue.fields.assignee?.displayName + '@example.com'

        const emailData: SLAEmailData = {
            issueKey: issue.key,
            issueSummary: issue.fields.summary,
            priority: issue.fields.priority.name,
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            alertType,
            percentageUsed: Math.round(sla.resolutionPercentageUsed),
            timeRemaining: formatRemainingTime(sla.resolutionTimeRemaining),
            jiraUrl: `${import.meta.env.VITE_JIRA_INSTANCE_URL}/browse/${issue.key}`
        }

        await axios.post('/api/notifications/send', {
            to,
            data: emailData
        })

        console.log(`[Notifications] Email sent for ${issue.key}`)
    } catch (error) {
        console.error('[Notifications] Failed to send email:', error)
        // Don't throw - email failures shouldn't break the app
    }
}

/**
 * Batch check all issues and trigger notifications
 */
export function batchCheckNotifications(issues: Array<{ issue: JiraIssue; sla: SLAData }>) {
    const atRiskCount = issues.filter(i => i.sla.isAtRisk && !i.sla.isResolved).length
    const breachedCount = issues.filter(i => i.sla.isBreached).length
    const pendingResponseCount = issues.filter(i => !i.sla.hasFirstResponse && !i.sla.isResolved).length

    // Create a summary notification if there are critical items
    if (breachedCount > 0 || atRiskCount > 3) {
        const { addNotification } = useNotificationStore.getState()
        addNotification({
            type: breachedCount > 0 ? 'error' : 'warning',
            title: 'SLA Status Summary',
            message: `${breachedCount} breached, ${atRiskCount} at risk, ${pendingResponseCount} pending response`,
            link: '/issues?activeTab=breached'
        })
    }
}
