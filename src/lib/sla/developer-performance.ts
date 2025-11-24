import { JiraIssue, SLAData } from '@/lib/jira/types'
import { differenceInMinutes } from 'date-fns'

export interface DeveloperPerformance {
    accountId: string
    displayName: string
    avatarUrl: string

    // Current workload
    totalActiveIssues: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
    atRiskIssues: number
    breachedIssues: number

    // Historical performance
    totalResolvedIssues: number
    slaComplianceRate: number // percentage
    averageFirstResponseTime: number // minutes
    averageResolutionTime: number // hours
}

export function calculateDeveloperPerformance(
    issues: Array<{ issue: JiraIssue, sla: SLAData }>,
    developers: Array<{ accountId: string, displayName: string, avatarUrl: string }>
): DeveloperPerformance[] {
    return developers.map(dev => {
        const devIssues = issues.filter(i => i.issue.fields.assignee?.accountId === dev.accountId)
        const activeIssues = devIssues.filter(i => !i.sla.isResolved)
        const resolvedIssues = devIssues.filter(i => i.sla.isResolved)

        // Workload counts
        const criticalIssues = activeIssues.filter(i => i.issue.fields.priority.name === 'Critical').length
        const highIssues = activeIssues.filter(i => i.issue.fields.priority.name === 'High').length
        const mediumIssues = activeIssues.filter(i => i.issue.fields.priority.name === 'Medium').length
        const lowIssues = activeIssues.filter(i => i.issue.fields.priority.name === 'Low').length

        const atRiskIssues = activeIssues.filter(i => i.sla.isAtRisk).length
        const breachedIssues = activeIssues.filter(i => i.sla.isBreached).length

        // Performance metrics
        const metIssues = resolvedIssues.filter(i => i.sla.resolutionStatus === 'met').length
        const slaComplianceRate = resolvedIssues.length > 0
            ? (metIssues / resolvedIssues.length) * 100
            : 0

        // Average response time (only for issues that have a response)
        const respondedIssues = devIssues.filter(i => i.sla.hasFirstResponse)
        const totalResponseTime = respondedIssues.reduce((acc, curr) => acc + curr.sla.firstResponseTimeElapsed, 0)
        const averageFirstResponseTime = respondedIssues.length > 0
            ? totalResponseTime / respondedIssues.length
            : 0

        // Average resolution time (only for resolved issues)
        const totalResolutionTime = resolvedIssues.reduce((acc, curr) => acc + curr.sla.resolutionTimeElapsed, 0)
        const averageResolutionTime = resolvedIssues.length > 0
            ? (totalResolutionTime / resolvedIssues.length) / 60 // Convert minutes to hours
            : 0

        return {
            accountId: dev.accountId,
            displayName: dev.displayName,
            avatarUrl: dev.avatarUrl,
            totalActiveIssues: activeIssues.length,
            criticalIssues,
            highIssues,
            mediumIssues,
            lowIssues,
            atRiskIssues,
            breachedIssues,
            totalResolvedIssues: resolvedIssues.length,
            slaComplianceRate,
            averageFirstResponseTime,
            averageResolutionTime
        }
    })
}

export function getTeamAverages(performances: DeveloperPerformance[]) {
    if (performances.length === 0) return {
        avgComplianceRate: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0
    }

    const totalCompliance = performances.reduce((acc, curr) => acc + curr.slaComplianceRate, 0)
    const totalResponse = performances.reduce((acc, curr) => acc + curr.averageFirstResponseTime, 0)
    const totalResolution = performances.reduce((acc, curr) => acc + curr.averageResolutionTime, 0)

    return {
        avgComplianceRate: totalCompliance / performances.length,
        avgResponseTime: totalResponse / performances.length,
        avgResolutionTime: totalResolution / performances.length
    }
}
