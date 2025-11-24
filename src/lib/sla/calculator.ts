import { differenceInMinutes } from 'date-fns';
import { SLA_RULES, PRIORITY_MAPPING } from './rules';
import type { JiraIssue, SLAData } from '../jira/types';
import type { SLASettings } from './store';

export function calculateSLA(issue: JiraIssue, settings?: SLASettings): SLAData {
    const jiraPriority = issue.fields.priority.name;
    // Map Jira priority to our SLA priority level
    const mappedPriority = PRIORITY_MAPPING[jiraPriority] || 'Medium';

    // Use provided settings or fallback to default rules
    const rules = settings ? settings.rules : SLA_RULES;
    let slaConfig = rules[mappedPriority];

    if (!slaConfig) {
        // Fallback to Medium priority for unknown priorities
        console.warn(`No SLA configuration for priority: ${mappedPriority}, falling back to Medium`);
        slaConfig = rules['Medium'] || SLA_RULES['Medium'];
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
    // DEBUG: Inspect status structure
    if (issue.key === 'SST-1') {
        console.log(`[SLA Debug] Issue ${issue.key} Status:`, JSON.stringify(issue.fields.status, null, 2));
    }

    const isResolved =
        ['Done', 'Resolved', 'Closed'].includes(issue.fields.status.name) ||
        issue.fields.status.statusCategory?.key === 'done';
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
        priority: jiraPriority,
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

// Developer performance calculation moved to separate file
// Import from: @/lib/sla/developer-performance
// This keeps the calculator focused on SLA calculations only
