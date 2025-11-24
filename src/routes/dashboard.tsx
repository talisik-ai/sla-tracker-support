import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { SLATimer } from '@/components/issues/SLATimer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateSLA } from '@/lib/sla/calculator'
import { MOCK_ISSUES } from '@/lib/jira/mock'
import { searchIssues } from '@/lib/jira/api'
import { JiraIssue, SLAData } from '@/lib/jira/types'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useCountUp } from '@/hooks/use-count-up'
import { useSLAStore } from '@/lib/sla/store'
import { batchCheckNotifications } from '@/lib/notifications/helpers'
import { SSEClient } from '@/lib/events/sse-client'
import { useNotificationStore } from '@/lib/notifications/store'
import { IssueStatusChart } from '@/components/dashboard/IssueStatusChart'
import { ResponseTimeChart } from '@/components/dashboard/ResponseTimeChart'
import { SLAComplianceChart } from '@/components/dashboard/SLAComplianceChart'
import { IssueDetailModal } from '@/components/issues/IssueDetailModal'
import '@/lib/notifications/demo' // Make demo function available in console

export const Route = createFileRoute('/dashboard')({
    component: DashboardPage,
})

function AnimatedValue({ value, suffix = '' }: { value: number, suffix?: string }) {
    const count = useCountUp(value)
    return <>{count}{suffix}</>
}

function DashboardPage() {
    const navigate = useNavigate()
    const [issues, setIssues] = React.useState<Array<{ issue: JiraIssue, sla: SLAData }>>([])
    const [loading, setLoading] = React.useState(true)
    const [projectInfo, setProjectInfo] = React.useState<{ id: string; name: string } | null>(null)
    const [isRefreshing, setIsRefreshing] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [isConnected, setIsConnected] = React.useState(false)
    const [selectedIssue, setSelectedIssue] = React.useState<{ issue: JiraIssue, sla: SLAData } | null>(null)
    const sseClientRef = React.useRef<SSEClient | null>(null)

    const { addNotification } = useNotificationStore()

    // Get settings and projectKey from store
    const store = useSLAStore()
    const projectKey = store.projectKey

    const loadData = React.useCallback(async () => {
        setIsRefreshing(true)
        try {
            let fetchedIssues: JiraIssue[] = []
            let usedMockData = false

            console.log('[Dashboard] Fetching from Jira API via server proxy...')
            try {
                // Use project key from store
                const jql = `project = "${projectKey}" ORDER BY created DESC`
                console.log('[Dashboard] Loading data with JQL:', jql)
                console.log('[Dashboard] Using projectKey from store:', projectKey)
                const response = await searchIssues(jql)
                fetchedIssues = response.issues
                console.log(`[Dashboard] Successfully fetched ${fetchedIssues.length} issues from Jira`)
                if (fetchedIssues.length > 0) {
                    console.log('[Dashboard] First issue sample:', JSON.stringify(fetchedIssues[0], null, 2))
                }
            } catch (apiError: any) {
                console.error('[Dashboard] Jira API Error:', apiError)
                // Fallback to mock data
                console.log('[Dashboard] Falling back to mock data')
                fetchedIssues = MOCK_ISSUES
                setError('Failed to load dashboard data from Jira. Using mock data.')
                usedMockData = true
            }

            const processed = fetchedIssues.map(issue => ({
                issue,
                sla: calculateSLA(issue, store)
            }))
            setIssues(processed)

            // Check for SLA issues and trigger notifications
            batchCheckNotifications(processed)

            // Only clear error if we successfully fetched from API, otherwise keep the mock data warning
            if (!usedMockData) {
                setError(null)
            }

            // Extract project info from the first issue
            if (fetchedIssues.length > 0 && fetchedIssues[0].fields.project) {
                setProjectInfo({
                    id: fetchedIssues[0].fields.project.key,
                    name: fetchedIssues[0].fields.project.name
                })
            }
        } catch (error) {
            console.error("[Dashboard] Failed to load data", error)
            setError('An unexpected error occurred while processing data.')
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [store, projectKey])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    // Initialize SSE connection for real-time updates
    React.useEffect(() => {
        console.log('[Dashboard] Initializing SSE connection...')

        const sseClient = new SSEClient('/api/events/stream')
        sseClientRef.current = sseClient

        sseClient.connect({
            connected: (data) => {
                console.log('[Dashboard] SSE connected:', data)
                setIsConnected(true)
            },
            heartbeat: () => {
                // Keep-alive heartbeat
                if (!isConnected) setIsConnected(true)
            },
            'issue-created': (data) => {
                console.log('[Dashboard] New issue created:', data.issueKey)
                addNotification({
                    type: 'info',
                    title: 'New Issue Created',
                    message: `${data.issueKey} was created in Jira`,
                    link: `/issues?search=${data.issueKey}`
                })
                // Reload data to include new issue
                loadData()
            },
            'issue-updated': (data) => {
                console.log('[Dashboard] Issue updated:', data.issueKey)
                // Update the specific issue in state
                setIssues(prev => {
                    const index = prev.findIndex(i => i.issue.key === data.issueKey)
                    if (index !== -1) {
                        const updated = [...prev]
                        updated[index] = {
                            issue: data.issue,
                            sla: calculateSLA(data.issue, store)
                        }
                        return updated
                    }
                    return prev
                })
                addNotification({
                    type: 'info',
                    title: 'Issue Updated',
                    message: `${data.issueKey} was updated in Jira`,
                    link: `/issues?search=${data.issueKey}`
                })
            },
            'issue-deleted': (data) => {
                console.log('[Dashboard] Issue deleted:', data.issueKey)
                setIssues(prev => prev.filter(i => i.issue.key !== data.issueKey))
                addNotification({
                    type: 'warning',
                    title: 'Issue Deleted',
                    message: `${data.issueKey} was deleted from Jira`
                })
            }
        })

        return () => {
            console.log('[Dashboard] Disconnecting SSE...')
            sseClient.disconnect()
            setIsConnected(false)
        }
    }, [loadData, store, addNotification])

    const stats = React.useMemo(() => {
        const total = issues.length
        const met = issues.filter(i => i.sla.overallStatus === 'met').length
        const atRisk = issues.filter(i => i.sla.isAtRisk).length
        const breached = issues.filter(i => i.sla.isBreached).length
        const pending = issues.filter(i => !i.sla.hasFirstResponse && !i.sla.isResolved).length
        const complianceRate = total > 0 ? Math.round((met / total) * 100) : 100

        // First Response metrics
        const pendingResponse = issues.filter(i => !i.sla.hasFirstResponse && !i.sla.isResolved).length
        const responseBreached = issues.filter(i => !i.sla.hasFirstResponse && i.sla.firstResponseStatus === 'breached').length

        // Calculate average first response time
        const responded = issues.filter(i => i.sla.hasFirstResponse)
        const avgFirstResponseTime = responded.length === 0
            ? 0
            : Math.round(responded.reduce((sum, i) => sum + i.sla.firstResponseTimeElapsed, 0) / responded.length)

        return { total, met, atRisk, breached, pending, complianceRate, pendingResponse, responseBreached, avgFirstResponseTime }
    }, [issues])

    // Chart data transformations
    const issueStatusData = React.useMemo(() => ({
        met: stats.met,
        atRisk: stats.atRisk,
        breached: stats.breached,
        pending: stats.pending,
    }), [stats])

    const responseTimeData = React.useMemo(() => {
        const priorities = ['Critical', 'High', 'Medium', 'Low']
        return priorities.map(priority => {
            const priorityIssues = issues.filter(i =>
                i.issue.fields.priority.name === priority && i.sla.hasFirstResponse
            )
            const avgTime = priorityIssues.length === 0
                ? 0
                : priorityIssues.reduce((sum, i) => sum + i.sla.firstResponseTimeElapsed, 0) / priorityIssues.length

            // Get target from first issue of this priority or use defaults
            const target = priorityIssues.length > 0
                ? priorityIssues[0].sla.firstResponseDeadline
                : priority === 'Critical' ? 60 : priority === 'High' ? 240 : 480

            return {
                priority,
                avgTime: Math.round(avgTime),
                target,
                count: priorityIssues.length
            }
        }).filter(d => d.count > 0) // Only show priorities with data
    }, [issues])

    const complianceData = React.useMemo(() => {
        // For now, show current snapshot as a single data point
        // In a real app, you'd fetch historical data from backend
        return [{
            date: 'Current',
            compliance: stats.complianceRate,
            total: stats.total
        }]
    }, [stats])

    if (loading && !issues.length) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        <span>{projectInfo ? `${projectInfo.name} (${projectInfo.id})` : 'Loading project info...'}</span>
                        {/* Real-time connection indicator */}
                        {isConnected && (
                            <span className="flex items-center gap-1 text-green-600 text-xs">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Live
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData()}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                    title="Total Issues"
                    value={<AnimatedValue value={stats.total} /> as any}
                    icon={<span className="text-xl">📋</span>}
                    onClick={() => navigate({ to: '/issues' })}
                />
                <MetricCard
                    title="SLA Compliance"
                    value={<AnimatedValue value={stats.complianceRate} suffix="%" /> as any}
                    icon={<span className="text-xl">✅</span>}
                    status={stats.complianceRate >= 90 ? 'success' : stats.complianceRate >= 75 ? 'warning' : 'critical'}
                    onClick={() => navigate({ to: '/issues' })}
                />
                <MetricCard
                    title="Pending Response"
                    value={<AnimatedValue value={stats.pendingResponse} /> as any}
                    icon={<span className="text-xl">💬</span>}
                    status={stats.responseBreached > 0 ? 'critical' : stats.pendingResponse > 0 ? 'warning' : 'neutral'}
                    onClick={() => navigate({ to: '/issues', search: { activeTab: 'pending-response' } })}
                />
                <MetricCard
                    title="At Risk"
                    value={<AnimatedValue value={stats.atRisk} /> as any}
                    icon={<span className="text-xl">⚠️</span>}
                    status={stats.atRisk > 0 ? 'warning' : 'neutral'}
                    onClick={() => navigate({ to: '/issues', search: { activeTab: 'at-risk' } })}
                />
                <MetricCard
                    title="Breached"
                    value={<AnimatedValue value={stats.breached} /> as any}
                    icon={<span className="text-xl">🚨</span>}
                    status={stats.breached > 0 ? 'critical' : 'neutral'}
                    onClick={() => navigate({ to: '/issues', search: { activeTab: 'breached' } })}
                />
            </div>

            {/* Analytics Charts */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <IssueStatusChart data={issueStatusData} />
                    <ResponseTimeChart data={responseTimeData} />
                </div>
                <div className="grid gap-4">
                    <SLAComplianceChart data={complianceData} />
                </div>
            </div>

            {/* Critical Issues */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Critical Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {issues
                                .filter(i => i.issue.fields.priority.name === 'Critical' && !i.sla.isResolved)
                                .map(({ issue, sla }) => (
                                    <div
                                        key={issue.id}
                                        className="flex items-center justify-between border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                                        onClick={() => setSelectedIssue({ issue, sla })}
                                    >
                                        <div className="space-y-1">
                                            <div className="font-medium">{issue.key}</div>
                                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                {typeof issue.fields.summary === 'string' ? issue.fields.summary : 'Summary not available'}
                                            </div>
                                        </div>
                                        <div className="w-32">
                                            <SLATimer
                                                deadlineHours={sla.resolutionDeadline}
                                                createdDate={sla.createdDate}
                                            />
                                        </div>
                                    </div>
                                ))}
                            {issues.filter(i => i.issue.fields.priority.name === 'Critical' && !i.sla.isResolved).length === 0 && (
                                <div className="text-sm text-muted-foreground">No active critical issues</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* At Risk Issues */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>At Risk Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {issues
                                .filter(i => i.sla.isAtRisk && !i.sla.isResolved)
                                .map(({ issue, sla }) => (
                                    <div
                                        key={issue.id}
                                        className="flex items-center justify-between border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                                        onClick={() => setSelectedIssue({ issue, sla })}
                                    >
                                        <div className="space-y-1">
                                            <div className="font-medium">{issue.key}</div>
                                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                {typeof issue.fields.summary === 'string' ? issue.fields.summary : 'Summary not available'}
                                            </div>
                                        </div>
                                        <div className="w-32">
                                            <SLATimer
                                                deadlineHours={sla.resolutionDeadline}
                                                createdDate={sla.createdDate}
                                            />
                                        </div>
                                    </div>
                                ))}
                            {issues.filter(i => i.sla.isAtRisk && !i.sla.isResolved).length === 0 && (
                                <div className="text-sm text-muted-foreground">No issues at risk</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Issue Detail Modal */}
            <IssueDetailModal
                issue={selectedIssue?.issue || null}
                sla={selectedIssue?.sla || null}
                isOpen={selectedIssue !== null}
                onClose={() => setSelectedIssue(null)}
            />
        </div>
    )
}
