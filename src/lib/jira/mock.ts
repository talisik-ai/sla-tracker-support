import { JiraIssue } from './types';
import { subHours, subDays } from 'date-fns';

const now = new Date();

export const MOCK_ISSUES: JiraIssue[] = [
    {
        id: '10001',
        key: 'SAL-101',
        fields: {
            project: { id: '10000', key: 'SWA2', name: 'Demo Web Application' },
            summary: 'Critical production bug in login flow',
            description: 'Users cannot login...',
            status: { name: 'Open', statusCategory: { key: 'new', name: 'To Do' } },
            priority: { name: 'Critical', iconUrl: '' },
            issuetype: { name: 'Bug', iconUrl: '' },
            assignee: { accountId: 'user1', displayName: 'Kim', avatarUrls: { '48x48': '' } },
            reporter: { accountId: 'reporter1', displayName: 'Reporter 1' },
            created: subHours(now, 1).toISOString(), // 1 hour ago
            updated: subHours(now, 1).toISOString(),
            resolutiondate: null,
            components: [{ name: 'Auth' }],
            labels: [],
            comment: { comments: [] }
        }
    },
    {
        id: '10002',
        key: 'SAL-102',
        fields: {
            project: { id: '10000', key: 'SWA2', name: 'Demo Web Application' },
            summary: 'High priority feature request',
            description: 'Need this feature...',
            status: { name: 'In Progress', statusCategory: { key: 'indeterminate', name: 'In Progress' } },
            priority: { name: 'High', iconUrl: '' },
            issuetype: { name: 'Story', iconUrl: '' },
            assignee: { accountId: 'user2', displayName: 'Alyssa', avatarUrls: { '48x48': '' } },
            reporter: { accountId: 'reporter1', displayName: 'Reporter 1' },
            created: subHours(now, 20).toISOString(), // 20 hours ago
            updated: subHours(now, 5).toISOString(),
            resolutiondate: null,
            components: [{ name: 'Frontend' }],
            labels: [],
            comment: { comments: [{ id: 'c1', author: { displayName: 'Alyssa' }, body: 'Working on it', created: subHours(now, 19).toISOString() }] }
        }
    },
    {
        id: '10003',
        key: 'SAL-103',
        fields: {
            project: { id: '10000', key: 'SWA2', name: 'Demo Web Application' },
            summary: 'Medium priority task',
            description: 'Do this task...',
            status: { name: 'Open', statusCategory: { key: 'new', name: 'To Do' } },
            priority: { name: 'Medium', iconUrl: '' },
            issuetype: { name: 'Task', iconUrl: '' },
            assignee: { accountId: 'user3', displayName: 'Keen', avatarUrls: { '48x48': '' } },
            reporter: { accountId: 'reporter2', displayName: 'Reporter 2' },
            created: subDays(now, 1).toISOString(), // 1 day ago
            updated: subDays(now, 1).toISOString(),
            resolutiondate: null,
            components: [{ name: 'DevOps' }],
            labels: [],
            comment: { comments: [] }
        }
    },
    {
        id: '10004',
        key: 'SAL-104',
        fields: {
            project: { id: '10000', key: 'SWA2', name: 'Demo Web Application' },
            summary: 'Low priority maintenance',
            description: 'Cleanup...',
            status: { name: 'Done', statusCategory: { key: 'done', name: 'Done' } },
            priority: { name: 'Low', iconUrl: '' },
            issuetype: { name: 'Task', iconUrl: '' },
            assignee: { accountId: 'user4', displayName: 'Mabel', avatarUrls: { '48x48': '' } },
            reporter: { accountId: 'reporter2', displayName: 'Reporter 2' },
            created: subDays(now, 3).toISOString(),
            updated: subDays(now, 1).toISOString(),
            resolutiondate: subDays(now, 1).toISOString(),
            components: [{ name: 'ML' }],
            labels: [],
            comment: { comments: [] }
        }
    },
    {
        id: '10005',
        key: 'SAL-105',
        fields: {
            project: { id: '10000', key: 'SWA2', name: 'Demo Web Application' },
            summary: 'Critical issue about to breach',
            description: 'Urgent...',
            status: { name: 'Open', statusCategory: { key: 'new', name: 'To Do' } },
            priority: { name: 'Critical', iconUrl: '' },
            issuetype: { name: 'Bug', iconUrl: '' },
            assignee: { accountId: 'user1', displayName: 'Kim', avatarUrls: { '48x48': '' } },
            reporter: { accountId: 'reporter1', displayName: 'Reporter 1' },
            created: subHours(now, 7).toISOString(), // 7 hours ago (SLA is 8h for resolution)
            updated: subHours(now, 7).toISOString(),
            resolutiondate: null,
            components: [{ name: 'Backend' }],
            labels: [],
            comment: { comments: [] }
        }
    }
];
