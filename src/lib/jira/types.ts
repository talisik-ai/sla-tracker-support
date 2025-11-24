export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    project: {
      id: string;
      key: string;
      name: string;
    };
    summary: string;
    description: string | any; // Can be string (mock) or ADF object (Jira v3)
    status: {
      name: string;
      statusCategory: { key: string; name: string; }
    };
    priority: {
      name: 'Highest' | 'Critical' | 'High' | 'Medium' | 'Low' | 'Lowest';
      iconUrl: string;
    };
    issuetype: {
      name: string;
      iconUrl: string;
    };
    assignee: {
      accountId: string;
      displayName: string;
      avatarUrls: { '48x48': string; }
    } | null;
    reporter: {
      accountId: string;
      displayName: string;
    };
    created: string; // ISO 8601
    updated: string;
    resolutiondate: string | null;
    components: Array<{ name: string; }>;
    labels: string[];
    comment: {
      comments: Array<{
        id: string;
        author: { displayName: string; };
        body: string | any; // Can be string (mock) or ADF object (Jira v3)
        created: string;
      }>;
    };
  };
}

export interface SLAData {
  issueKey: string;
  priority: string;  // Jira priority name (can be Highest, Critical, High, Medium, Low, Lowest, etc.);
  createdDate: Date;

  // First Response SLA
  firstResponseDeadline: number; // hours
  firstResponseDate: Date | null;
  hasFirstResponse: boolean;
  firstResponseTimeElapsed: number; // minutes
  firstResponseTimeRemaining: number; // minutes
  firstResponsePercentageUsed: number; // 0-100+
  firstResponseStatus: 'on-track' | 'at-risk' | 'breached' | 'met';

  // Resolution SLA
  resolutionDeadline: number; // hours
  resolutionDate: Date | null;
  isResolved: boolean;
  resolutionTimeElapsed: number; // minutes
  resolutionTimeRemaining: number; // minutes
  resolutionPercentageUsed: number; // 0-100+
  resolutionStatus: 'on-track' | 'at-risk' | 'breached' | 'met';

  // Overall status
  overallStatus: 'on-track' | 'at-risk' | 'breached' | 'met';
  isAtRisk: boolean;
  isBreached: boolean;
}

export interface DeveloperPerformance {
  accountId: string;
  displayName: string;
  avatarUrl: string;

  // Current workload
  totalActiveIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  atRiskIssues: number;
  breachedIssues: number;

  // Historical performance
  totalResolvedIssues: number;
  slaComplianceRate: number; // percentage
  firstResponseCompliance: number; // percentage
  averageFirstResponseTime: number; // minutes
  averageResolutionTime: number; // hours

  // This period (e.g., last 30 days)
  resolvedThisPeriod: number;
  breachedThisPeriod: number;
  complianceRateThisPeriod: number;
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}
