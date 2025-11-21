import axios from 'axios'
import type { SLAData } from './types'
import { mapSLAStatus } from './custom-fields'

export interface SyncResult {
    success: boolean
    issueKey: string
    syncedAt?: string
    error?: string
}

/**
 * Sync SLA data for a single issue to Jira custom fields
 */
export async function syncSLAToJira(
    issueKey: string,
    sla: SLAData
): Promise<SyncResult> {
    try {
        // Calculate due date from deadline hours
        const dueDate = new Date(sla.createdDate)
        dueDate.setHours(dueDate.getHours() + sla.resolutionDeadline)

        const response = await axios.post('/api/jira/update-sla', {
            issueKey,
            slaData: {
                dueDate: dueDate.toISOString(),
                status: mapSLAStatus(sla.overallStatus),
                timeUsedPercent: sla.resolutionPercentageUsed,
            },
        })

        return response.data
    } catch (error: any) {
        console.error(`Failed to sync ${issueKey}:`, error)
        return {
            success: false,
            issueKey,
            error: error.response?.data?.error || error.message,
        }
    }
}

/**
 * Sync multiple issues to Jira
 * Returns array of results with progress tracking
 */
export async function bulkSyncSLAToJira(
    issues: Array<{ issueKey: string; sla: SLAData }>,
    onProgress?: (current: number, total: number, issueKey: string) => void
): Promise<SyncResult[]> {
    const results: SyncResult[] = []

    for (let i = 0; i < issues.length; i++) {
        const { issueKey, sla } = issues[i]

        onProgress?.(i + 1, issues.length, issueKey)

        const result = await syncSLAToJira(issueKey, sla)
        results.push(result)

        // Small delay to avoid rate limiting
        if (i < issues.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200))
        }
    }

    return results
}

/**
 * Get sync summary from results
 */
export function getSyncSummary(results: SyncResult[]): {
    total: number
    successful: number
    failed: number
    errors: Array<{ issueKey: string; error: string }>
} {
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length
    const errors = results
        .filter((r) => !r.success)
        .map((r) => ({ issueKey: r.issueKey, error: r.error || 'Unknown error' }))

    return {
        total: results.length,
        successful,
        failed,
        errors,
    }
}
