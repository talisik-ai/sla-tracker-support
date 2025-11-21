import axios from 'axios';
import type { JiraIssue, JiraSearchResponse } from './types';

// Project key can remain client-side for building JQL queries
export const PROJECT_KEY = import.meta.env.VITE_JIRA_PROJECT_KEY || 'SAL';


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
    console.log('[Client API] Current PROJECT_KEY:', PROJECT_KEY)
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
 * @param projectKey - Project key to query (optional, uses default if not provided)
 * @returns JQL string for project filter
 */
export function buildProjectJQL(projectKey?: string): string {
    const key = projectKey || PROJECT_KEY
    return `project = "${key}"`
}

/**
 * Get all issues for the Salina project
 */
export async function getAllProjectIssues(): Promise<JiraIssue[]> {
    const jql = `project = "${PROJECT_KEY}" ORDER BY created DESC`;
    const response = await searchIssues(jql, { maxResults: 1000 });
    return response.issues;
}

/**
 * Get open issues (not resolved)
 */
export async function getOpenIssues(): Promise<JiraIssue[]> {
    const jql = `project = "${PROJECT_KEY}" AND status != Done AND status != Resolved AND status != Closed ORDER BY priority DESC, created ASC`;
    const response = await searchIssues(jql);
    return response.issues;
}

/**
 * Get critical priority issues
 */
export async function getCriticalIssues(): Promise<JiraIssue[]> {
    const jql = `project = "${PROJECT_KEY}" AND priority = Critical AND status != Done ORDER BY created ASC`;
    const response = await searchIssues(jql);
    return response.issues;
}

/**
 * Get issues by priority
 */
export async function getIssuesByPriority(
    priority: 'Critical' | 'High' | 'Medium' | 'Low'
): Promise<JiraIssue[]> {
    const jql = `project = "${PROJECT_KEY}" AND priority = ${priority} AND status != Done ORDER BY created ASC`;
    const response = await searchIssues(jql);
    return response.issues;
}

/**
 * Get issues assigned to a developer
 */
export async function getIssuesByAssignee(accountId: string): Promise<JiraIssue[]> {
    const jql = `project = "${PROJECT_KEY}" AND assignee = "${accountId}" ORDER BY priority DESC, created ASC`;
    const response = await searchIssues(jql);
    return response.issues;
}
