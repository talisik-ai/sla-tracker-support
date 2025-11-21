import { differenceInMinutes } from 'date-fns';
import { SLA_RULES } from './rules';
import type { JiraIssue, SLAData } from '../jira/types';
import type { SLASettings } from './store';

export function calculateSLA(issue: JiraIssue, settings?: SLASettings): SLAData {
    const priority = issue.fields.priority.name;
    // Use provided settings or fallback to default rules
    const rules = settings ? settings.rules : SLA_RULES;
    const slaConfig = rules[priority];

    if (!slaConfig) {
        // Fallback or throw? Let's throw for now to catch issues early, or fallback to Low?
        // For safety, let's log and fallback to Low if possible, but throwing is better for dev.
        // But in prod, we might want to be safe.
        // Let's assume priority matches our config.
        throw new Error(`No SLA configuration for priority: ${priority}`);
    }

    const createdDate = new Date(issue.fields.created);
    const now = new Date();

    // Calculate first response SLA
    const hasFirstResponse = issue.fields.comment.comments.length > 0;
    const firstResponseDate = hasFirstResponse
        ? new Date(issue.fields.comment.comments[0].created)
        : null;

    const firstResponseTimeElapsed = hasFirstResponse
        ? differenceInMinutes(firstResponseDate!, createdDate)
        : differenceInMinutes(now, createdDate);

    const firstResponseDeadlineMinutes = slaConfig.firstResponseHours * 60;
    const firstResponseTimeRemaining = firstResponseDeadlineMinutes - firstResponseTimeElapsed;
    const firstResponsePercentageUsed = (firstResponseTimeElapsed / firstResponseDeadlineMinutes) * 100;

    const firstResponseStatus = hasFirstResponse
        ? 'met'
        : firstResponsePercentageUsed >= 100
            ? 'breached'
            : firstResponsePercentageUsed >= 75
                ? 'at-risk'
                : 'on-track';

    // Calculate resolution SLA
    const isResolved = ['Done', 'Resolved', 'Closed'].includes(issue.fields.status.name);
    const resolutionDate = issue.fields.resolutiondate
        ? new Date(issue.fields.resolutiondate)
        : null;

    const resolutionTimeElapsed = isResolved
        ? differenceInMinutes(resolutionDate!, createdDate)
        : differenceInMinutes(now, createdDate);

    const resolutionDeadlineMinutes = slaConfig.resolutionHours * 60;
    const resolutionTimeRemaining = resolutionDeadlineMinutes - resolutionTimeElapsed;
    const resolutionPercentageUsed = (resolutionTimeElapsed / resolutionDeadlineMinutes) * 100;

    const resolutionStatus = isResolved
        ? resolutionPercentageUsed <= 100 ? 'met' : 'breached'
        : resolutionPercentageUsed >= 100
            ? 'breached'
            : resolutionPercentageUsed >= 75
                ? 'at-risk'
                : 'on-track';

    // Overall status (worst of the two)
    const statusPriority = { 'breached': 4, 'at-risk': 3, 'met': 2, 'on-track': 1 };
    const overallStatus = statusPriority[resolutionStatus] > statusPriority[firstResponseStatus]
        ? resolutionStatus
        : firstResponseStatus;

    return {
        issueKey: issue.key,
        priority: priority as 'Critical' | 'High' | 'Medium' | 'Low',
        createdDate,

        // First Response
        firstResponseDeadline: slaConfig.firstResponseHours,
        firstResponseDate,
        hasFirstResponse,
        firstResponseTimeElapsed,
        firstResponseTimeRemaining,
        firstResponsePercentageUsed,
        firstResponseStatus,

        // Resolution
        resolutionDeadline: slaConfig.resolutionHours,
        resolutionDate,
        isResolved,
        resolutionTimeElapsed,
        resolutionTimeRemaining,
        resolutionPercentageUsed,
        resolutionStatus,

        // Overall
        overallStatus,
        isAtRisk: overallStatus === 'at-risk',
        isBreached: overallStatus === 'breached',
    };
}

export function calculateDeveloperPerformance(
    _issues: Array<{ issue: JiraIssue; sla: SLAData }>
): Map<string, any> {
    // Placeholder for now, will implement fully later
    return new Map();
}
