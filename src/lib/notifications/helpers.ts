import { useNotificationStore, Notification } from '@/lib/notifications/store'
import { SLAData, JiraIssue } from '@/lib/jira/types'
import { formatRemainingTime } from '@/lib/utils/time'
import { SLAEmailData } from '@/lib/email/client'
import axios from 'axios'

// Deduplication: Track recent notifications to prevent duplicates
const recentNotifications = new Map<string, number>()
const DEDUP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Check if a similar notification was recently created
 */
function isDuplicateNotification(key: string): boolean {
    const lastTime = recentNotifications.get(key)
    if (lastTime && Date.now() - lastTime < DEDUP_WINDOW_MS) {
        return true
    }
    recentNotifications.set(key, Date.now())
    
    // Clean up old entries periodically
    if (recentNotifications.size > 100) {
        const now = Date.now()
        recentNotifications.forEach((time, k) => {
            if (now - time > DEDUP_WINDOW_MS) {
                recentNotifications.delete(k)
            }
        })
    }
    
    return false
}

/**
 * Add notification with deduplication
 */
function addNotificationSafe(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const dedupKey = `${notification.title}-${notification.message}`
    
    if (isDuplicateNotification(dedupKey)) {
        console.log('[Notifications] Skipping duplicate notification:', notification.title)
        return
    }
    
    const { addNotification } = useNotificationStore.getState()
    addNotification(notification)
}

/**
 * Check SLA status and trigger notifications if needed
 */
export function checkAndNotify(issue: JiraIssue, sla: SLAData, prevSLA?: SLAData) {
    // Check if status changed to at-risk
    if (sla.isAtRisk && (!prevSLA || !prevSLA.isAtRisk)) {
        const message = `${issue.key} is approaching its SLA deadline (${Math.round(sla.resolutionPercentageUsed)}% time used)`

        // Add in-app notification (with deduplication)
        addNotificationSafe({
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
        const message = `${issue.key} has breached its SLA deadline (${Math.round(sla.resolutionPercentageUsed)}% time used)`

        // Add in-app notification (with deduplication)
        addNotificationSafe({
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
            addNotificationSafe({
                type: 'warning',
                title: 'First Response SLA At Risk',
                message: `${issue.key} needs a first response soon (${Math.round(sla.firstResponsePercentageUsed)}% time used)`,
                link: `/issues?search=${issue.key}`
            })
        }
    }

    // Check if first response is breached
    if (!sla.hasFirstResponse && sla.firstResponsePercentageUsed >= 100) {
        if (!prevSLA || prevSLA.firstResponsePercentageUsed < 100) {
            addNotificationSafe({
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
        // Check if email notifications are enabled
        const settings = getNotificationSettings()
        if (!settings.emailEnabled) {
            console.log('[Notifications] Email notifications disabled, skipping')
            return
        }

        // Get recipient email - use configured email, or assignee email, or fallback
        const configuredEmail = import.meta.env.VITE_SLA_ALERT_EMAIL
        const assigneeEmail = issue.fields.assignee?.emailAddress
        const to = configuredEmail || assigneeEmail || null

        if (!to) {
            console.warn('[Notifications] No valid email recipient found, skipping email')
            return
        }

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

        console.log(`[Notifications] Email sent for ${issue.key} to ${to}`)
    } catch (error) {
        console.error('[Notifications] Failed to send email:', error)
        // Don't throw - email failures shouldn't break the app
    }
}

/**
 * Batch check all issues and trigger notifications
 */
export function batchCheckNotifications(issues: Array<{ issue: JiraIssue; sla: SLAData }>) {
    const settings = getNotificationSettings()
    if (!settings.inAppEnabled) {
        console.log('[Notifications] In-app notifications disabled, skipping batch check')
        return
    }

    const atRiskCount = issues.filter(i => i.sla.isAtRisk && !i.sla.isResolved).length
    const breachedCount = issues.filter(i => i.sla.isBreached).length
    const pendingResponseCount = issues.filter(i => !i.sla.hasFirstResponse && !i.sla.isResolved).length

    // Create a summary notification if there are critical items
    if (breachedCount > 0 || atRiskCount > 3) {
        addNotificationSafe({
            type: breachedCount > 0 ? 'error' : 'warning',
            title: 'SLA Status Summary',
            message: `${breachedCount} breached, ${atRiskCount} at risk, ${pendingResponseCount} pending response`,
            link: '/issues?activeTab=breached'
        })
    }
}

// ============================================
// Notification Settings Management
// ============================================

export interface NotificationSettings {
    inAppEnabled: boolean
    emailEnabled: boolean
    soundEnabled: boolean
    quietHoursEnabled: boolean
    quietHoursStart: string // "22:00"
    quietHoursEnd: string   // "08:00"
}

const DEFAULT_SETTINGS: NotificationSettings = {
    inAppEnabled: true,
    emailEnabled: true,
    soundEnabled: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
}

const SETTINGS_KEY = 'sla-notification-settings'

/**
 * Get notification settings from localStorage
 */
export function getNotificationSettings(): NotificationSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    
    try {
        const stored = localStorage.getItem(SETTINGS_KEY)
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
        }
    } catch (error) {
        console.error('[Notifications] Failed to load settings:', error)
    }
    return DEFAULT_SETTINGS
}

/**
 * Save notification settings to localStorage
 */
export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
    if (typeof window === 'undefined') return
    
    try {
        const current = getNotificationSettings()
        const updated = { ...current, ...settings }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
        console.log('[Notifications] Settings saved:', updated)
    } catch (error) {
        console.error('[Notifications] Failed to save settings:', error)
    }
}

/**
 * Check if currently in quiet hours
 */
export function isInQuietHours(): boolean {
    const settings = getNotificationSettings()
    if (!settings.quietHoursEnabled) return false
    
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { quietHoursStart, quietHoursEnd } = settings
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (quietHoursStart > quietHoursEnd) {
        return currentTime >= quietHoursStart || currentTime < quietHoursEnd
    }
    
    // Same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= quietHoursStart && currentTime < quietHoursEnd
}

/**
 * Play notification sound
 */
export function playNotificationSound(type: 'info' | 'warning' | 'error' | 'success'): void {
    const settings = getNotificationSettings()
    
    if (!settings.soundEnabled || isInQuietHours()) {
        return
    }
    
    // Use Web Audio API for a simple notification sound
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Different frequencies for different notification types
        const frequencies: Record<string, number> = {
            info: 440,    // A4
            success: 523, // C5
            warning: 392, // G4
            error: 330    // E4
        }
        
        oscillator.frequency.value = frequencies[type] || 440
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
        console.warn('[Notifications] Could not play sound:', error)
    }
}
