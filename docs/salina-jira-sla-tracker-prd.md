# Product Requirements Document (PRD)
# Salina Jira SLA Tracking System

**Version:** 1.0  
**Date:** November 17, 2025  
**Project Code Name:** Salina SLA Tracker  
**Target Release:** Phase 1 MVP - 3 weeks  

---

## 1. Executive Summary

### 1.1 Product Overview
Build a standalone web application that monitors and tracks Service Level Agreements (SLAs) for Jira issues in the Salina project. The system will provide real-time SLA monitoring, developer performance tracking, and automated alerting to ensure compliance with response and resolution time commitments.

### 1.2 Problem Statement
- Native Jira lacks granular SLA tracking without Jira Service Management (additional cost)
- Team needs visibility into SLA compliance for 50 users across 4 developers
- Current manual tracking is inefficient and error-prone
- No clear developer performance metrics for SLA adherence

### 1.3 Business Goals
1. Achieve 95%+ SLA compliance rate across all priority levels
2. Reduce average response time by 30% through better visibility
3. Enable proactive issue management with at-risk alerts
4. Provide data-driven insights for team capacity planning

### 1.4 Success Metrics
- SLA compliance rate by priority level
- Average time to first response
- Average time to resolution
- Number of breached vs. met SLAs
- Developer workload distribution
- User satisfaction with issue response times

---

## 2. Technical Stack

### 2.1 Frontend
- **Framework:** TanStack Start (React-based full-stack framework)
- **UI Library:** shadcn/ui (Tailwind CSS components)
- **State Management:** Zustand + TanStack Query
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Type Safety:** TypeScript (strict mode)

### 2.2 Backend
- **Runtime:** Node.js (via TanStack Start server)
- **API Integration:** Jira REST API v3
- **Authentication:** Jira API Tokens (Basic Auth)
- **Caching:** In-memory cache (Phase 1), Redis (Phase 2)
- **Webhooks:** Jira webhooks for real-time updates (Phase 2)

### 2.3 Deployment
- **Hosting:** Vercel or Cloudflare Pages
- **Environment:** Node.js 18+
- **CI/CD:** GitHub Actions

### 2.4 External APIs
- **Jira REST API v3:** https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- **Endpoints Used:**
  - `/rest/api/3/search` - Search issues with JQL
  - `/rest/api/3/issue/{issueKey}` - Get issue details
  - `/rest/api/3/issue/{issueKey}/changelog` - Get issue history
  - `/rest/api/3/issue/{issueKey}/transitions` - Update issue status
  - `/rest/api/3/issue/{issueKey}/comment` - Get/add comments

---

## 3. SLA Rules Configuration

### 3.1 Priority Levels & SLA Targets

| Priority | First Response | Resolution | With Dependencies | Coverage |
|----------|---------------|------------|-------------------|----------|
| Critical | 2 hours | 8 hours | 24 hours | 24/7 |
| High | 2 hours (business hrs)<br>4 hours (after hrs) | 24 hours | 48 hours | 24/7 monitored |
| Medium | 4 hours | 48 hours | 72 hours | Business hours |
| Low | 8 hours | 120 hours (5 days) | 240 hours (10 days) | Business hours |

### 3.2 Business Hours
- **Primary Support:** Monday - Friday, 8:00 AM - 6:00 PM Philippine Time (PHT)
- **Timezone:** Asia/Manila (UTC+8)
- **Holidays:** Observe Philippine public holidays

### 3.3 SLA Status Definitions
- **On Track:** 0-75% of SLA time elapsed
- **At Risk:** 75-100% of SLA time elapsed
- **Breached:** >100% of SLA time elapsed
- **Met:** Issue resolved/responded within SLA

### 3.4 Team Structure
- **Front End Developer:** Alyssa
- **Back End Developer:** Kim
- **DevOps Engineer:** Keen
- **Machine Learning Engineer:** Mabel

---

## 4. Functional Requirements

### 4.1 Phase 1: MVP Features (Priority: P0)

#### 4.1.1 Dashboard Overview
**User Story:** As a team lead, I want to see an at-a-glance view of all SLA metrics so I can quickly identify issues requiring attention.

**Requirements:**
- Display total issue count by priority (Critical, High, Medium, Low)
- Show SLA compliance rate percentage (Met vs Breached)
- Display count of issues currently at risk (75%+ of SLA time)
- Show count of breached SLAs
- Display active issues by status (Open, In Progress, etc.)
- Real-time updates every 30 seconds
- Responsive design (desktop, tablet, mobile)

**Data Sources:**
- Jira JQL Query: `project = "SAL" AND status != Done`
- Calculate SLA status client-side from issue data

**UI Components:**
- Metric cards with color coding (green=good, amber=warning, red=critical)
- Animated counters
- Last updated timestamp
- Refresh button

---

#### 4.1.2 Critical Issues View
**User Story:** As a developer, I want to see all critical issues requiring immediate response so I can prioritize my work.

**Requirements:**
- List all Critical priority issues not yet resolved
- Display for each issue:
  - Issue key (e.g., SAL-123)
  - Summary/title
  - Assignee (with avatar)
  - Created date/time
  - Time elapsed since creation
  - Time remaining until SLA breach
  - Visual SLA timer (progress bar or countdown)
  - Current status
- Sort by: time remaining (ascending by default)
- Filter by: assignee, status
- Click issue to view details
- Visual alert if within 30 minutes of breach

**Data Sources:**
- Jira JQL: `project = "SAL" AND priority = Critical AND status != Done ORDER BY created ASC`

**UI Components:**
- Sortable/filterable data table
- SLA countdown timer component
- Status badge component
- Assignee avatar component

---

#### 4.1.3 At-Risk Issues View
**User Story:** As a team lead, I want to see all issues approaching their SLA deadline so I can intervene before breaches occur.

**Requirements:**
- List all issues at 75%+ of SLA time (any priority)
- Display same fields as Critical Issues View
- Group by priority level
- Highlight issues at 90%+ in orange, 100%+ in red
- Show estimated time to breach
- One-click action to view issue in Jira
- Email notification capability (Phase 2)

**Data Sources:**
- Fetch all open issues, calculate SLA status, filter at-risk

**Calculation Logic:**
```
timeElapsed = currentTime - issueCreatedTime
slaDeadline = getSLADeadline(priority)
percentageUsed = (timeElapsed / slaDeadline) * 100

isAtRisk = percentageUsed >= 75 && percentageUsed < 100
isBreached = percentageUsed >= 100
```

---

#### 4.1.4 Issue Detail Modal
**User Story:** As a developer, I want to see complete issue information without leaving the dashboard so I can work efficiently.

**Requirements:**
- Display in modal overlay (not separate page)
- Show all issue fields:
  - Issue key, title, description
  - Priority, status, type
  - Assignee, reporter
  - Created date, updated date, resolved date (if applicable)
  - Labels, components
- Show SLA information:
  - First response deadline and status
  - Resolution deadline and status
  - Time elapsed, time remaining
  - Visual countdown timer
- Display comment thread (read-only in Phase 1)
- Show status history/changelog
- Link to open issue in Jira (new tab)

**Data Sources:**
- `/rest/api/3/issue/{issueKey}` with expanded fields
- `/rest/api/3/issue/{issueKey}/changelog`

---

#### 4.1.5 Developer Performance View
**User Story:** As a team lead, I want to see how each developer is performing against SLAs so I can provide support and balance workload.

**Requirements:**
- Display for each developer:
  - Name and avatar
  - Total active issues assigned
  - Issues by priority breakdown
  - SLA compliance rate (% met)
  - Average time to first response
  - Average time to resolution
  - Current at-risk issues count
  - Current breached issues count
- Sort by: name, active issues, compliance rate
- Click developer to filter issue views
- Show team averages for comparison

**Data Sources:**
- Aggregate data from all issues assigned to each developer
- Calculate metrics from issue history

**Calculations:**
```typescript
// For each developer
const assignedIssues = issues.filter(i => i.assignee === developer)
const resolvedIssues = assignedIssues.filter(i => i.status === 'Done')

const slaCompliance = 
  resolvedIssues.filter(i => i.slaStatus === 'met').length / 
  resolvedIssues.length * 100

const avgResponseTime = 
  sum(resolvedIssues.map(i => i.firstResponseTime)) / 
  resolvedIssues.length

const avgResolutionTime = 
  sum(resolvedIssues.map(i => i.resolutionTime)) / 
  resolvedIssues.length
```

---

#### 4.1.6 Issue List View (All Issues)
**User Story:** As a QA, I want to browse all issues with flexible filtering so I can find specific issues quickly.

**Requirements:**
- Tabbed interface:
  - All Issues
  - Critical
  - High
  - Medium
  - Low
  - At Risk
  - Breached
- Display fields: key, summary, priority, status, assignee, created, SLA status
- Advanced filters:
  - Priority (multi-select)
  - Status (multi-select)
  - Assignee (multi-select)
  - Date range (created/updated)
  - SLA status (on-track, at-risk, breached, met)
- Search by: issue key, summary text
- Sort by: any column
- Pagination (50 issues per page)
- Export to CSV (Phase 2)

**Data Sources:**
- Base JQL: `project = "SAL"`
- Apply filters dynamically to JQL

---

### 4.2 Phase 2: Enhanced Features (Priority: P1)

#### 4.2.1 Real-time Updates via Webhooks
- Set up Jira webhooks for issue events
- Update dashboard without page refresh
- Toast notifications for new critical issues
- Live SLA countdown timers

#### 4.2.2 Notifications & Alerts
- Email notifications at 75%, 90%, 100% SLA
- Slack integration for team alerts
- Desktop notifications (browser API)
- Customizable alert preferences per user

#### 4.2.3 Analytics & Reporting
- Weekly/monthly SLA compliance reports
- Trend charts (compliance over time)
- Developer performance trends
- Downloadable PDF reports
- Scheduled email reports

#### 4.2.4 Advanced Issue Management
- Add comments from dashboard
- Transition issues (change status)
- Assign/reassign issues
- Bulk operations

---

### 4.3 Phase 3: Advanced Features (Priority: P2)

#### 4.3.1 Custom Dashboards
- User-customizable layouts
- Drag-and-drop widgets
- Save dashboard configurations
- Multiple dashboard views

#### 4.3.2 Automation & Workflows
- Auto-assignment rules based on team capacity
- Escalation rules for breached SLAs
- Custom automation triggers
- Integration with external tools

#### 4.3.3 Historical Data & Insights
- Long-term SLA trend analysis
- Predictive analytics for capacity planning
- Issue type patterns
- Performance benchmarking

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Initial page load: < 2 seconds
- API response time: < 500ms (p95)
- Dashboard refresh: every 30 seconds
- Support 50 concurrent users
- Handle 1000+ issues without performance degradation

### 5.2 Reliability
- 99.5% uptime target
- Graceful error handling for Jira API failures
- Retry logic for failed requests (3 attempts)
- Fallback to cached data if Jira unavailable

### 5.3 Security
- Jira credentials stored in environment variables only
- Never expose API tokens client-side
- All Jira API calls through server proxy
- Implement rate limiting (10 requests/second per user)
- Input validation and sanitization
- HTTPS only in production

### 5.4 Usability
- Responsive design (desktop, tablet, mobile)
- Accessible (WCAG 2.1 Level AA)
- Intuitive navigation (max 3 clicks to any feature)
- Consistent color coding (green=good, amber=warning, red=critical)
- Loading states for all async operations
- Clear error messages with action guidance

### 5.5 Maintainability
- TypeScript with strict mode
- ESLint + Prettier configuration
- Unit test coverage: >70%
- Component documentation (Storybook optional)
- Code comments for complex logic
- README with setup instructions

---

## 6. Data Model & Schema

### 6.1 Jira Issue Data (from API)
```typescript
interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
      statusCategory: { key: string; name: string; }
    };
    priority: {
      name: 'Critical' | 'High' | 'Medium' | 'Low';
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
        body: string;
        created: string;
      }>;
    };
  };
}
```

### 6.2 Calculated SLA Data
```typescript
interface SLAData {
  issueKey: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
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
```

### 6.3 Developer Performance Data
```typescript
interface DeveloperPerformance {
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
  averageFirstResponseTime: number; // minutes
  averageResolutionTime: number; // hours
  
  // This period (e.g., last 30 days)
  resolvedThisPeriod: number;
  breachedThisPeriod: number;
  complianceRateThisPeriod: number;
}
```

---

## 7. API Specifications

### 7.1 Internal API Routes (TanStack Start)

#### GET `/api/dashboard/metrics`
Get overall dashboard metrics.

**Response:**
```typescript
{
  totalIssues: number;
  issuesByPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issuesByStatus: {
    open: number;
    inProgress: number;
    resolved: number;
  };
  slaCompliance: {
    total: number;
    met: number;
    breached: number;
    complianceRate: number;
  };
  atRiskCount: number;
  breachedCount: number;
  lastUpdated: string; // ISO 8601
}
```

---

#### GET `/api/issues`
Get issues with optional filters.

**Query Parameters:**
- `priority` (optional): Critical|High|Medium|Low
- `status` (optional): string
- `assignee` (optional): accountId
- `slaStatus` (optional): on-track|at-risk|breached|met
- `limit` (optional, default: 50): number
- `offset` (optional, default: 0): number

**Response:**
```typescript
{
  issues: Array<{
    issue: JiraIssue;
    sla: SLAData;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

---

#### GET `/api/issues/:issueKey`
Get detailed information for a specific issue.

**Response:**
```typescript
{
  issue: JiraIssue;
  sla: SLAData;
  changelog: Array<{
    id: string;
    created: string;
    author: { displayName: string; };
    items: Array<{
      field: string;
      fromString: string;
      toString: string;
    }>;
  }>;
}
```

---

#### GET `/api/developers/performance`
Get performance metrics for all developers.

**Response:**
```typescript
{
  developers: Array<DeveloperPerformance>;
  teamAverages: {
    avgComplianceRate: number;
    avgResponseTime: number;
    avgResolutionTime: number;
  };
}
```

---

#### GET `/api/developers/:accountId/performance`
Get detailed performance for a specific developer.

**Query Parameters:**
- `period` (optional, default: 30): number of days

**Response:**
```typescript
{
  developer: DeveloperPerformance;
  recentIssues: Array<{
    issueKey: string;
    summary: string;
    priority: string;
    resolvedDate: string;
    resolutionTime: number; // hours
    slaStatus: string;
  }>;
  trends: {
    complianceByWeek: Array<{ week: string; rate: number; }>;
    avgResolutionByWeek: Array<{ week: string; hours: number; }>;
  };
}
```

---

### 7.2 Jira API Integration

#### Authentication
```typescript
// Basic Auth with API Token
const authHeader = `Basic ${Buffer.from(
  `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
).toString('base64')}`;

// All requests include:
headers: {
  'Authorization': authHeader,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}
```

#### Rate Limiting
- Jira Cloud rate limit: ~100 requests per minute per IP
- Implement client-side rate limiting
- Use caching to reduce API calls
- Batch requests when possible

#### Error Handling
```typescript
// Standard error response format
{
  error: {
    code: string; // e.g., 'JIRA_API_ERROR'
    message: string;
    details?: any;
  };
}
```

---

## 8. User Interface Specifications

### 8.1 Design System

#### Color Palette
```css
/* Primary colors */
--primary: hsl(222.2 47.4% 11.2%);
--primary-foreground: hsl(210 40% 98%);

/* Status colors */
--critical: hsl(0 84% 60%);      /* Red */
--high: hsl(24 100% 50%);        /* Orange */
--medium: hsl(45 100% 51%);      /* Yellow */
--low: hsl(142 71% 45%);         /* Green */

--on-track: hsl(142 71% 45%);    /* Green */
--at-risk: hsl(45 100% 51%);     /* Yellow/Amber */
--breached: hsl(0 84% 60%);      /* Red */
--met: hsl(142 71% 45%);         /* Green */

/* Neutral colors */
--background: hsl(0 0% 100%);
--foreground: hsl(222.2 84% 4.9%);
--muted: hsl(210 40% 96.1%);
--border: hsl(214.3 31.8% 91.4%);
```

#### Typography
- **Font Family:** System font stack (Inter, SF Pro, Roboto)
- **Headings:** 
  - H1: 2rem (32px), font-weight: 700
  - H2: 1.5rem (24px), font-weight: 600
  - H3: 1.25rem (20px), font-weight: 600
- **Body:** 1rem (16px), font-weight: 400, line-height: 1.5

#### Spacing
- Use 4px base unit (0.25rem)
- Common spacing: 4, 8, 12, 16, 24, 32, 48, 64px

---

### 8.2 Layout Structure

```
┌────────────────────────────────────────────────────────┐
│  Header (Sticky)                                       │
│  Logo | Navigation | User Menu                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Main Content Area                                     │
│  (Responsive, max-width: 1400px, centered)            │
│                                                        │
│  [Dashboard/Issues/Developers content]                 │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Footer                                                │
│  Version | Last Updated | Documentation Link           │
└────────────────────────────────────────────────────────┘
```

---

### 8.3 Key UI Components

#### 8.3.1 Metric Card
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  status?: 'critical' | 'warning' | 'success' | 'neutral';
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  onClick?: () => void;
}
```

**Visual Design:**
- Card with border and subtle shadow
- Large number display (2rem)
- Small title text above
- Optional icon on left
- Color-coded by status
- Hover effect if clickable

---

#### 8.3.2 SLA Timer Component
```typescript
interface SLATimerProps {
  deadline: number; // hours
  startTime: Date;
  endTime?: Date; // if resolved
  status: 'on-track' | 'at-risk' | 'breached' | 'met';
  showProgressBar?: boolean;
  compact?: boolean;
}
```

**Visual Design:**
- Progress bar showing percentage used
- Color changes based on status:
  - Green: 0-75%
  - Amber: 75-100%
  - Red: >100%
- Text showing time remaining/elapsed
- Countdown updates every minute

---

#### 8.3.3 Issue Card
```typescript
interface IssueCardProps {
  issue: JiraIssue;
  sla: SLAData;
  onClick?: () => void;
  showAssignee?: boolean;
  showSLATimer?: boolean;
  compact?: boolean;
}
```

**Visual Design:**
- Card layout with hover effect
- Issue key (bold) + summary
- Priority badge (colored)
- Status badge
- Assignee avatar
- SLA timer (if showSLATimer)
- Click to open details

---

#### 8.3.4 Developer Card
```typescript
interface DeveloperCardProps {
  developer: DeveloperPerformance;
  onClick?: () => void;
}
```

**Visual Design:**
- Avatar (48x48)
- Name
- Metrics grid:
  - Active issues
  - SLA compliance %
  - Avg response time
  - At risk count
- Color-coded metrics
- Click to view details

---

### 8.4 Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  /* Single column layouts */
  /* Compact cards */
  /* Hamburger menu */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2-column layouts */
  /* Standard cards */
}

/* Desktop */
@media (min-width: 1025px) {
  /* 3-4 column layouts */
  /* Full-size cards */
  /* Side navigation */
}
```

---

## 9. Implementation Guidelines

### 9.1 File Structure
```
salina-sla-tracker/
├── app/
│   ├── routes/
│   │   ├── __root.tsx                 # Root layout with nav
│   │   ├── index.tsx                  # Landing/redirect to dashboard
│   │   ├── dashboard/
│   │   │   └── index.tsx              # Main dashboard page
│   │   ├── issues/
│   │   │   ├── index.tsx              # All issues list
│   │   │   ├── critical.tsx           # Critical issues
│   │   │   ├── at-risk.tsx            # At-risk issues
│   │   │   └── $issueKey.tsx          # Issue detail (dynamic)
│   │   ├── developers/
│   │   │   ├── index.tsx              # All developers
│   │   │   └── $accountId.tsx         # Developer detail
│   │   └── api/
│   │       ├── dashboard.metrics.ts
│   │       ├── issues.index.ts
│   │       ├── issues.$issueKey.ts
│   │       └── developers.performance.ts
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (other shadcn components)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── MetricsGrid.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── issues/
│   │   │   ├── IssueCard.tsx
│   │   │   ├── IssueTable.tsx
│   │   │   ├── IssueDetail.tsx
│   │   │   ├── SLATimer.tsx
│   │   │   ├── SLABadge.tsx
│   │   │   ├── PriorityBadge.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── IssueFilters.tsx
│   │   ├── developers/
│   │   │   ├── DeveloperCard.tsx
│   │   │   ├── DeveloperGrid.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── WorkloadChart.tsx
│   │   └── charts/
│   │       ├── ComplianceChart.tsx
│   │       ├── TrendChart.tsx
│   │       └── DistributionChart.tsx
│   ├── lib/
│   │   ├── jira/
│   │   │   ├── client.ts              # Axios client setup
│   │   │   ├── api.ts                 # API functions
│   │   │   ├── queries.ts             # React Query hooks
│   │   │   └── types.ts               # TypeScript types
│   │   ├── sla/
│   │   │   ├── calculator.ts          # SLA calculation logic
│   │   │   ├── rules.ts               # SLA rules config
│   │   │   └── utils.ts               # Helper functions
│   │   ├── utils/
│   │   │   ├── date.ts                # Date formatting/parsing
│   │   │   ├── formatting.ts          # Text formatting
│   │   │   └── cn.ts                  # Class name utility
│   │   └── constants.ts               # App-wide constants
│   ├── hooks/
│   │   ├── useIssues.ts               # Issues data hook
│   │   ├── useDevelopers.ts           # Developers data hook
│   │   ├── useMetrics.ts              # Metrics data hook
│   │   └── useRefreshInterval.ts      # Auto-refresh hook
│   ├── styles/
│   │   └── globals.css                # Global styles + Tailwind
│   └── router.tsx                     # TanStack Router config
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── .env.example                       # Environment template
├── .env.local                         # Local environment (gitignored)
├── .eslintrc.cjs
├── .prettierrc
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

### 9.2 Environment Variables
```bash
# .env.local
VITE_APP_NAME="Salina SLA Tracker"
VITE_APP_VERSION="1.0.0"

# Jira Configuration
JIRA_INSTANCE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEY=SAL

# Timezone
TZ=Asia/Manila

# Optional: Cache configuration
CACHE_TTL=300  # 5 minutes in seconds
```

---

### 9.3 Core Implementation Logic

#### 9.3.1 SLA Calculator (app/lib/sla/calculator.ts)
```typescript
import { differenceInMinutes, differenceInHours } from 'date-fns';
import { SLA_RULES } from './rules';
import type { JiraIssue, SLAData } from '../jira/types';

export function calculateSLA(issue: JiraIssue): SLAData {
  const priority = issue.fields.priority.name;
  const slaConfig = SLA_RULES[priority];
  
  if (!slaConfig) {
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
    priority,
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
  issues: Array<{ issue: JiraIssue; sla: SLAData }>
): Map<string, DeveloperPerformance> {
  const developerMap = new Map<string, DeveloperPerformance>();
  
  for (const { issue, sla } of issues) {
    if (!issue.fields.assignee) continue;
    
    const accountId = issue.fields.assignee.accountId;
    
    if (!developerMap.has(accountId)) {
      developerMap.set(accountId, {
        accountId,
        displayName: issue.fields.assignee.displayName,
        avatarUrl: issue.fields.assignee.avatarUrls['48x48'],
        totalActiveIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        atRiskIssues: 0,
        breachedIssues: 0,
        totalResolvedIssues: 0,
        slaComplianceRate: 0,
        averageFirstResponseTime: 0,
        averageResolutionTime: 0,
        resolvedThisPeriod: 0,
        breachedThisPeriod: 0,
        complianceRateThisPeriod: 0,
      });
    }
    
    const dev = developerMap.get(accountId)!;
    
    // Count active issues
    if (!sla.isResolved) {
      dev.totalActiveIssues++;
      
      switch (sla.priority) {
        case 'Critical': dev.criticalIssues++; break;
        case 'High': dev.highIssues++; break;
        case 'Medium': dev.mediumIssues++; break;
        case 'Low': dev.lowIssues++; break;
      }
      
      if (sla.isAtRisk) dev.atRiskIssues++;
      if (sla.isBreached) dev.breachedIssues++;
    }
    
    // Count resolved issues
    if (sla.isResolved) {
      dev.totalResolvedIssues++;
      
      if (sla.resolutionStatus === 'met') {
        // Met SLA
      } else if (sla.resolutionStatus === 'breached') {
        // Breached SLA
      }
    }
  }
  
  // Calculate averages (requires historical data - Phase 2)
  // For now, these will be calculated from the current dataset
  
  return developerMap;
}
```

---

#### 9.3.2 SLA Rules Configuration (app/lib/sla/rules.ts)
```typescript
export interface SLARule {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  firstResponseHours: number;
  resolutionHours: number;
  resolutionWithDependenciesHours: number;
  businessHoursOnly: boolean;
}

export const SLA_RULES: Record<string, SLARule> = {
  'Critical': {
    priority: 'Critical',
    firstResponseHours: 2,
    resolutionHours: 8,
    resolutionWithDependenciesHours: 24,
    businessHoursOnly: false, // 24/7
  },
  'High': {
    priority: 'High',
    firstResponseHours: 2, // business hours, 4 after hours
    resolutionHours: 24,
    resolutionWithDependenciesHours: 48,
    businessHoursOnly: false, // monitored 24/7
  },
  'Medium': {
    priority: 'Medium',
    firstResponseHours: 4,
    resolutionHours: 48,
    resolutionWithDependenciesHours: 72,
    businessHoursOnly: true,
  },
  'Low': {
    priority: 'Low',
    firstResponseHours: 8,
    resolutionHours: 120, // 5 days
    resolutionWithDependenciesHours: 240, // 10 days
    businessHoursOnly: true,
  },
};

export const BUSINESS_HOURS = {
  timezone: 'Asia/Manila',
  startHour: 8,  // 8 AM
  endHour: 18,   // 6 PM
  weekdays: [1, 2, 3, 4, 5], // Monday - Friday
};

// Philippine public holidays 2025
export const HOLIDAYS_2025 = [
  '2025-01-01', // New Year
  '2025-04-09', // Araw ng Kagitingan
  '2025-04-17', // Maundy Thursday
  '2025-04-18', // Good Friday
  '2025-05-01', // Labor Day
  '2025-06-12', // Independence Day
  '2025-08-25', // Ninoy Aquino Day
  '2025-08-31', // National Heroes Day
  '2025-11-30', // Bonifacio Day
  '2025-12-25', // Christmas
  '2025-12-30', // Rizal Day
  '2025-12-31', // New Year's Eve
];
```

---

#### 9.3.3 Jira API Client (app/lib/jira/client.ts)
```typescript
import axios, { AxiosError } from 'axios';

const JIRA_BASE_URL = process.env.JIRA_INSTANCE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  throw new Error('Missing required Jira environment variables');
}

const authHeader = `Basic ${Buffer.from(
  `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
).toString('base64')}`;

export const jiraClient = axios.create({
  baseURL: JIRA_BASE_URL,
  headers: {
    'Authorization': authHeader,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for logging
jiraClient.interceptors.request.use(
  (config) => {
    console.log(`[Jira API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
jiraClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error('[Jira API Error]', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('[Jira API] No response received', error.request);
    } else {
      console.error('[Jira API] Request setup error', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default jiraClient;
```

---

#### 9.3.4 Jira API Functions (app/lib/jira/api.ts)
```typescript
import jiraClient from './client';
import type { JiraIssue, JiraSearchResponse } from './types';

const PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'SAL';

/**
 * Search for issues using JQL
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
  
  const response = await jiraClient.get<JiraSearchResponse>('/rest/api/3/search', {
    params: {
      jql,
      fields: fields.join(','),
      maxResults: options?.maxResults || 100,
      startAt: options?.startAt || 0,
      expand: 'changelog',
    },
  });
  
  return response.data;
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

/**
 * Get a specific issue by key
 */
export async function getIssue(issueKey: string): Promise<JiraIssue> {
  const response = await jiraClient.get<JiraIssue>(`/rest/api/3/issue/${issueKey}`, {
    params: {
      expand: 'changelog,renderedFields',
    },
  });
  return response.data;
}

/**
 * Get issue changelog
 */
export async function getIssueChangelog(issueKey: string) {
  const response = await jiraClient.get(`/rest/api/3/issue/${issueKey}/changelog`);
  return response.data;
}

/**
 * Get available transitions for an issue
 */
export async function getIssueTransitions(issueKey: string) {
  const response = await jiraClient.get(`/rest/api/3/issue/${issueKey}/transitions`);
  return response.data.transitions;
}

/**
 * Transition an issue (change status)
 */
export async function transitionIssue(issueKey: string, transitionId: string) {
  await jiraClient.post(`/rest/api/3/issue/${issueKey}/transitions`, {
    transition: { id: transitionId },
  });
}

/**
 * Add a comment to an issue
 */
export async function addComment(issueKey: string, comment: string) {
  await jiraClient.post(`/rest/api/3/issue/${issueKey}/comment`, {
    body: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: comment,
            },
          ],
        },
      ],
    },
  });
}
```

---

### 9.4 Testing Requirements

#### Unit Tests
- Test SLA calculation logic with various scenarios
- Test date/time utilities
- Test data transformation functions
- Coverage target: >70%

#### Integration Tests
- Test Jira API integration (with mocked responses)
- Test API routes
- Test error handling

#### E2E Tests (Optional for Phase 1)
- Test critical user flows
- Test dashboard loading and navigation
- Test issue filtering and sorting

---

## 10. Deployment

### 10.1 Deployment Platform
**Recommended:** Vercel

**Why Vercel:**
- Native TanStack Start support
- Automatic deployments from Git
- Environment variable management
- Built-in caching and CDN
- Generous free tier

**Alternative:** Cloudflare Pages, Netlify

---

### 10.2 Deployment Steps

1. **Environment Setup**
   - Add environment variables in Vercel dashboard
   - Configure production API tokens

2. **Build Configuration**
   ```json
   // package.json
   {
     "scripts": {
       "dev": "vinxi dev",
       "build": "vinxi build",
       "start": "vinxi start"
     }
   }
   ```

3. **Deploy**
   ```bash
   # Connect to Vercel
   vercel

   # Deploy to production
   vercel --prod
   ```

---

### 10.3 Monitoring & Logging

**Phase 1:**
- Console.log for debugging
- Vercel analytics for performance
- Error boundary for React errors

**Phase 2:**
- Sentry for error tracking
- LogRocket for session replay
- Custom analytics dashboard

---

## 11. Success Criteria

### 11.1 Launch Criteria (Phase 1 MVP)
- [ ] All P0 features implemented and tested
- [ ] Dashboard loads in < 2 seconds
- [ ] No critical bugs
- [ ] Documentation complete (README, API docs)
- [ ] Environment setup documented
- [ ] Deployed to production

### 11.2 Acceptance Criteria
- [ ] Users can view all issues with SLA status
- [ ] Users can filter issues by priority, status, assignee
- [ ] SLA timers update in real-time
- [ ] Dashboard refreshes automatically every 30 seconds
- [ ] At-risk issues are clearly highlighted
- [ ] Developer performance metrics are accurate
- [ ] Mobile responsive design works on all screens
- [ ] No Jira API credentials exposed client-side

---

## 12. Future Enhancements (Post-MVP)

### 12.1 Phase 2 Features
- Real-time updates via webhooks
- Email/Slack notifications
- Advanced analytics and reports
- Issue management (comment, transition)

### 12.2 Phase 3 Features
- Custom dashboards
- Automation rules
- Historical data analysis
- Predictive analytics

### 12.3 Integration Opportunities
- Slack bot for SLA alerts
- Microsoft Teams integration
- Email digest reports
- Mobile app (React Native)
- Browser extension for quick access

---

## 13. Risk & Mitigation

### 13.1 Technical Risks

**Risk:** Jira API rate limiting  
**Mitigation:** Implement caching, batch requests, respect rate limits

**Risk:** Jira API downtime  
**Mitigation:** Implement retry logic, fallback to cached data, graceful error messages

**Risk:** SLA calculation errors  
**Mitigation:** Comprehensive unit tests, validate against sample data, logging

**Risk:** Performance issues with large datasets  
**Mitigation:** Pagination, virtual scrolling, lazy loading, optimize queries

### 13.2 Business Risks

**Risk:** Jira API token exposure  
**Mitigation:** Never store in client-side code, use server-side proxy, rotate tokens regularly

**Risk:** Incorrect SLA calculations leading to missed commitments  
**Mitigation:** Thorough testing, validation against manual calculations, phased rollout

**Risk:** Low user adoption  
**Mitigation:** User training, feedback sessions, iterative improvements

---

## 14. Documentation Requirements

### 14.1 User Documentation
- [ ] User guide (how to use the dashboard)
- [ ] SLA rules explanation
- [ ] FAQ

### 14.2 Developer Documentation
- [ ] README with setup instructions
- [ ] API documentation (routes and responses)
- [ ] Architecture overview
- [ ] Deployment guide
- [ ] Troubleshooting guide

### 14.3 Code Documentation
- [ ] JSDoc comments for complex functions
- [ ] Inline comments for business logic
- [ ] Type definitions with descriptions

---

## 15. Appendix

### 15.1 Glossary
- **SLA:** Service Level Agreement - commitment to response/resolution time
- **JQL:** Jira Query Language - SQL-like query language for Jira
- **First Response SLA:** Time until first comment/response on an issue
- **Resolution SLA:** Time until issue is marked as resolved/closed
- **At Risk:** Issue using 75-100% of allocated SLA time
- **Breached:** Issue exceeded 100% of allocated SLA time

### 15.2 Reference Documents
- Salina SLA Policy (QA-BR-003 v1.2)
- Jira REST API Documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- TanStack Start Documentation: https://tanstack.com/start/latest
- shadcn/ui Documentation: https://ui.shadcn.com/

### 15.3 Team Contacts
- **Project Owner:** Erick Luna (Lunaxcode)
- **Development Team:**
  - Front End: Alyssa
  - Back End: Kim
  - DevOps: Keen
  - Machine Learning: Mabel

---

## 16. Approval & Sign-off

**Document Version:** 1.0  
**Prepared By:** Claude (AI Assistant)  
**Date:** November 17, 2025  

**Stakeholder Approval:**
- [ ] Product Owner: Erick Luna
- [ ] Development Team Lead: _______________
- [ ] QA Lead: _______________

---

**Next Steps:**
1. Review and approve this PRD
2. Set up development environment
3. Create Git repository
4. Begin Phase 1 implementation (Target: 3 weeks)
5. Weekly progress reviews

---

**End of Document**
