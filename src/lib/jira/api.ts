import axios from 'axios';
import type { JiraIssue, JiraSearchResponse } from './types';

// Default project key from environment (used as fallback only)
const DEFAULT_PROJECT_KEY = import.meta.env.VITE_JIRA_PROJECT_KEY || 'SAL';


/**
 * Search for issues using JQL via the server-side proxy
 * This avoids CORS issues by making the actual Jira API call from the server
 */
export async function searchIssues(
    jql: string,
    options?: {
        fields?: string[];
        maxResults?: number;
        startAt?: number;
    }
): Promise<JiraSearchResponse> {
    const fields = options?.fields || [
        'project',
        'summary',
        'description',
        'status',
        'priority',
        'issuetype',
        'assignee',
        'reporter',
        'created',
        'updated',
        'resolutiondate',
        'components',
        'labels',
        'comment',
    ];

    // Call the local server proxy endpoint instead of Jira directly
    console.log('[Client API] searchIssues called with JQL:', jql)
    const response = await axios.get<JiraSearchResponse>(
        '/api/jira/search',
        {
            params: {
                jql,
                fields: fields.join(','),
                maxResults: options?.maxResults || 100,
                startAt: options?.startAt || 0,
            },
            timeout: 30000,
        }
    );

    return response.data;
}

/**
 * Build JQL for project key
 * @param projectKey - Project key to query (required)
 * @returns JQL string for project filter
 */
export function buildProjectJQL(projectKey: string): string {
    return `project = "${projectKey}"`
}

/**
 * Get all issues for the project
 * @param projectKey - The Jira project key (required, no fallback)
 */
export async function getAllProjectIssues(projectKey: string): Promise<JiraIssue[]> {
    if (!projectKey) {
        throw new Error('Project key is required. Please configure it in Settings.');
    }
    console.log(`[API] getAllProjectIssues called with key: "${projectKey}"`);
    const jql = `project = "${projectKey}" ORDER BY created DESC`;
    // Reduced maxResults to 100 to prevent timeouts/errors on developers page
    const response = await searchIssues(jql, { maxResults: 100 });
    return response.issues;
}

/**
 * Get open issues (not resolved)
 * @param projectKey - The Jira project key (required)
 */
export async function getOpenIssues(projectKey: string): Promise<JiraIssue[]> {
    if (!projectKey) {
        throw new Error('Project key is required. Please configure it in Settings.');
    }
    const jql = `project = "${projectKey}" AND status != Done AND status != Resolved AND status != Closed ORDER BY priority DESC, created ASC`;
    const response = await searchIssues(jql);
    return response.issues;
}

/**
 * Get critical priority issues
 * @param projectKey - The Jira project key (required)
 */
export async function getCriticalIssues(projectKey: string): Promise<JiraIssue[]> {
    if (!projectKey) {
        throw new Error('Project key is required. Please configure it in Settings.');
    }
    const jql = `project = "${projectKey}" AND priority = Critical AND status != Done ORDER BY created ASC`;
    const response = await searchIssues(jql);
    return response.issues;
}

/**
 * Get issues by priority
 * @param projectKey - The Jira project key (required)
 * @param priority - Issue priority level
 */
export async function getIssuesByPriority(
    projectKey: string,
    priority: 'Critical' | 'High' | 'Medium' | 'Low'
): Promise<JiraIssue[]> {
    if (!projectKey) {
        throw new Error('Project key is required. Please configure it in Settings.');
    }
    const jql = `project = "${projectKey}" AND priority = ${priority} AND status != Done ORDER BY created ASC`;
    const response = await searchIssues(jql);
    return response.issues;
}

/**
 * Get issues assigned to a developer
 * @param projectKey - The Jira project key (required)
 * @param accountId - Jira account ID of the developer
 */
export async function getIssuesByAssignee(projectKey: string, accountId: string): Promise<JiraIssue[]> {
    if (!projectKey) {
        throw new Error('Project key is required. Please configure it in Settings.');
    }
    const jql = `project = "${projectKey}" AND assignee = "${accountId}" ORDER BY priority DESC, created ASC`;
    const response = await searchIssues(jql);
    return response.issues;
}

/**
 * Get issue changelog/history
 */
export async function getIssueChangelog(issueKey: string) {
    const response = await axios.get(`/api/jira/issue/${issueKey}/changelog`, {
        timeout: 10000,
    });
    return response.data;
}
