import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { calculateSLA } from '@/lib/sla/calculator'
import { calculateDeveloperPerformance } from '@/lib/sla/developer-performance'
import { getAllProjectIssues } from '@/lib/jira/api'
import { useSLAStore } from '@/lib/sla/store'
import { JiraIssue, SLAData } from '@/lib/jira/types'
import { MOCK_ISSUES } from '@/lib/jira/mock'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
    File02Icon, 
    File01Icon, 
    Download01Icon, 
    UserGroupIcon, 
    BarChartIcon,
    CheckListIcon,
    ChartIncreaseIcon,
    AlertCircleIcon,
    CheckmarkCircle02Icon
} from '@hugeicons/core-free-icons'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    exportSLASummaryToExcel,
    exportSLASummaryToPDF,
    exportSLASummaryToMarkdown,
    exportDeveloperPerformanceToExcel,
    exportDeveloperPerformanceToPDF,
    exportDeveloperPerformanceToMarkdown,
    exportIssueStatusToExcel,
    exportIssueStatusToPDF,
    exportIssueStatusToMarkdown,
    type SLASummaryData,
    type DeveloperReportData,
    type IssueReportData
} from '@/lib/reports/export-utils'
import { differenceInMinutes } from 'date-fns'

export const Route = createFileRoute('/reports')({
    component: ReportsPage,
})

function ReportsPage() {
    const [issues, setIssues] = React.useState<Array<{ issue: JiraIssue, sla: SLAData }>>([])
    const [loading, setLoading] = React.useState(true)
    const [exporting, setExporting] = React.useState<string | null>(null)
    const [exportAlert, setExportAlert] = React.useState<{ type: 'error' | 'warning'; message: string } | null>(null)

    const store = useSLAStore()
    const projectKey = store.projectKey
    const settings = useSLAStore((state) => state)

    React.useEffect(() => {
        async function loadData() {
            try {
                let fetchedIssues: JiraIssue[] = []
                try {
                    console.log('[Reports] Fetching issues for project:', projectKey)
                    fetchedIssues = await getAllProjectIssues(projectKey)
                    console.log(`[Reports] Successfully fetched ${fetchedIssues.length} issues`)
                } catch (apiError) {
                    console.error('[Reports] Jira API Error:', apiError)
                    console.warn('[Reports] Falling back to MOCK_ISSUES')
                    fetchedIssues = MOCK_ISSUES
                }

                const processed = fetchedIssues.map(issue => ({
                    issue,
                    sla: calculateSLA(issue, settings)
                }))
                setIssues(processed)
            } catch (error) {
                console.error("[Reports] Failed to load data", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [projectKey, settings])

    // Calculate SLA Summary Data
    const slaSummary = React.useMemo((): SLASummaryData => {
        const totalIssues = issues.length
        const metSLA = issues.filter(i => i.sla.overallStatus === 'met').length
        const breachedSLA = issues.filter(i => i.sla.isBreached).length
        const atRiskSLA = issues.filter(i => i.sla.isAtRisk && !i.sla.isBreached).length
        const ongoingSLA = totalIssues - metSLA - breachedSLA
        const complianceRate = totalIssues > 0 ? Math.round((metSLA / totalIssues) * 100) : 100

        return {
            totalIssues,
            metSLA,
            breachedSLA,
            atRiskSLA,
            ongoingSLA,
            complianceRate
        }
    }, [issues])

    // Calculate Developer Performance Data
    const developerData = React.useMemo((): DeveloperReportData[] => {
        if (issues.length === 0) {
            console.log('[Reports] No issues available for developer data')
            return []
        }

        const uniqueAssignees = new Map<string, { accountId: string, displayName: string, avatarUrl: string }>()

        issues.forEach(i => {
            if (i.issue.fields.assignee) {
                const { accountId, displayName, avatarUrls } = i.issue.fields.assignee
                if (!uniqueAssignees.has(accountId)) {
                    uniqueAssignees.set(accountId, {
                        accountId,
                        displayName,
                        avatarUrl: avatarUrls['48x48']
                    })
                }
            }
        })

        const developers = Array.from(uniqueAssignees.values())
        console.log('[Reports] Found developers:', developers.length, developers.map(d => d.displayName))
        
        const isMockData = issues.length > 0 && issues[0].issue.key.startsWith('SAL-')

        if (developers.length === 0 && isMockData) {
            console.log('[Reports] Using mock developers for mock data')
            const mockDevs = [
                { accountId: '712020:6a60519f-4318-4d04-8028-22874130099e', displayName: 'Alyssa', avatarUrl: '' },
                { accountId: '712020:c7183664-500e-43c3-9828-565d7023199c', displayName: 'Kim', avatarUrl: '' },
                { accountId: '712020:80453308-5969-451e-b816-524675762699', displayName: 'Keen', avatarUrl: '' },
                { accountId: '712020:e9423642-1718-472e-9e7f-68211043239a', displayName: 'Mabel', avatarUrl: '' },
            ]
            const perfData = calculateDeveloperPerformance(issues, mockDevs)
            return perfData.map(dev => {
                const devIssues = issues.filter(i => i.issue.fields.assignee?.accountId === dev.accountId)
                const resolvedIssues = devIssues.filter(i => i.sla.isResolved)
                const metIssues = resolvedIssues.filter(i => i.sla.resolutionStatus === 'met').length
                
                return {
                    name: dev.displayName,
                    totalIssues: devIssues.length,
                    metSLA: metIssues,
                    breached: dev.breachedIssues,
                    atRisk: dev.atRiskIssues,
                    complianceRate: isNaN(dev.slaComplianceRate) ? 0 : dev.slaComplianceRate,
                    avgResponseTime: isNaN(dev.averageFirstResponseTime) ? 0 : dev.averageFirstResponseTime,
                    avgResolutionTime: isNaN(dev.averageResolutionTime) ? 0 : dev.averageResolutionTime
                }
            })
        }

        if (developers.length === 0) {
            console.log('[Reports] No developers found, returning empty array')
            return []
        }

        const perfData = calculateDeveloperPerformance(issues, developers)
        console.log('[Reports] Calculated performance data:', perfData)
        
        const reportData = perfData.map(dev => {
            const devIssues = issues.filter(i => i.issue.fields.assignee?.accountId === dev.accountId)
            const resolvedIssues = devIssues.filter(i => i.sla.isResolved)
            const metIssues = resolvedIssues.filter(i => i.sla.resolutionStatus === 'met').length
            
            return {
                name: dev.displayName,
                totalIssues: devIssues.length,
                metSLA: metIssues,
                breached: dev.breachedIssues,
                atRisk: dev.atRiskIssues,
                complianceRate: isNaN(dev.slaComplianceRate) ? 0 : dev.slaComplianceRate,
                avgResponseTime: isNaN(dev.averageFirstResponseTime) ? 0 : dev.averageFirstResponseTime,
                avgResolutionTime: isNaN(dev.averageResolutionTime) ? 0 : dev.averageResolutionTime
            }
        })
        
        console.log('[Reports] Final report data:', reportData)
        return reportData
    }, [issues])

    // Calculate Issue Status Data
    const issueData = React.useMemo((): IssueReportData[] => {
        return issues.map(({ issue, sla }) => {
            const timeElapsed = sla.resolutionDate 
                ? differenceInMinutes(sla.resolutionDate, sla.createdDate)
                : differenceInMinutes(new Date(), sla.createdDate)
            
            const timeRemaining = (sla.resolutionDeadline * 60) - timeElapsed
            
            return {
                key: issue.key,
                summary: issue.fields.summary,
                priority: issue.fields.priority.name,
                status: issue.fields.status.name,
                assignee: issue.fields.assignee?.displayName || 'Unassigned',
                created: new Date(issue.fields.created).toLocaleDateString(),
                slaStatus: sla.isBreached ? 'Breached' : sla.isAtRisk ? 'At Risk' : sla.overallStatus === 'met' ? 'Met' : 'On Track',
                timeElapsed: `${Math.floor(timeElapsed / 60)}h ${timeElapsed % 60}m`,
                timeRemaining: timeRemaining > 0 
                    ? `${Math.floor(timeRemaining / 60)}h ${timeRemaining % 60}m` 
                    : `Overdue by ${Math.floor(Math.abs(timeRemaining) / 60)}h ${Math.abs(timeRemaining) % 60}m`
            }
        })
    }, [issues])

    const handleExport = async (reportType: string, format: 'xlsx' | 'pdf' | 'md') => {
        setExporting(`${reportType}-${format}`)
        
        try {
            // Brief delay for UX
            await new Promise(resolve => setTimeout(resolve, 300))
            
            const timestamp = new Date().toISOString().split('T')[0]
            
            switch (reportType) {
                case 'sla-summary':
                    if (format === 'xlsx') {
                        await exportSLASummaryToExcel(slaSummary, `sla-summary-${timestamp}`)
                    } else if (format === 'pdf') {
                        await exportSLASummaryToPDF(slaSummary, `sla-summary-${timestamp}`)
                    } else {
                        exportSLASummaryToMarkdown(slaSummary, `sla-summary-${timestamp}`)
                    }
                    break
                
                case 'developer-performance':
                    if (developerData.length === 0) {
                        setExportAlert({ type: 'warning', message: 'No developer data available to export.' })
                        return
                    }
                    console.log('[Reports] Exporting developer data:', developerData)
                    if (format === 'xlsx') {
                        await exportDeveloperPerformanceToExcel(developerData, `developer-performance-${timestamp}`)
                    } else if (format === 'pdf') {
                        await exportDeveloperPerformanceToPDF(developerData, `developer-performance-${timestamp}`)
                    } else {
                        exportDeveloperPerformanceToMarkdown(developerData, `developer-performance-${timestamp}`)
                    }
                    break
                
                case 'issue-status':
                    if (issueData.length === 0) {
                        setExportAlert({ type: 'warning', message: 'No issue data available to export.' })
                        return
                    }
                    if (format === 'xlsx') {
                        await exportIssueStatusToExcel(issueData, `issue-status-${timestamp}`)
                    } else if (format === 'pdf') {
                        await exportIssueStatusToPDF(issueData, `issue-status-${timestamp}`)
                    } else {
                        exportIssueStatusToMarkdown(issueData, `issue-status-${timestamp}`)
                    }
                    break
            }
            
            console.log(`[Reports] Successfully exported ${reportType} as ${format}`)
        } catch (error) {
            console.error('[Reports] Export failed:', error)
            setExportAlert({ 
                type: 'error', 
                message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
            })
        } finally {
            setExporting(null)
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Sticky Header */}
            <div className="sticky top-14 z-40 bg-background pb-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-sm text-muted-foreground">Generate and export SLA reports for management and analysis</p>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HugeiconsIcon icon={CheckListIcon} size={16} className="text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Total Issues</p>
                        </div>
                        <p className="text-2xl font-bold">{slaSummary.totalIssues}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-green-600" />
                            <p className="text-xs text-muted-foreground">Met SLA</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{slaSummary.metSLA}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-red-600" />
                            <p className="text-xs text-muted-foreground">Breached</p>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{slaSummary.breachedSLA}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HugeiconsIcon icon={ChartIncreaseIcon} size={16} className="text-amber-600" />
                            <p className="text-xs text-muted-foreground">At Risk</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">{slaSummary.atRiskSLA}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HugeiconsIcon icon={BarChartIcon} size={16} className="text-blue-600" />
                            <p className="text-xs text-muted-foreground">Compliance</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{slaSummary.complianceRate}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Report Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* SLA Summary Report */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={BarChartIcon} size={20} className="text-primary" />
                            <CardTitle>SLA Summary Report</CardTitle>
                        </div>
                        <CardDescription>
                            Overall SLA compliance metrics and breakdown by status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Issues:</span>
                                <span className="font-medium">{slaSummary.totalIssues}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Compliance Rate:</span>
                                <Badge variant={slaSummary.complianceRate >= 90 ? 'default' : 'destructive'}>
                                    {slaSummary.complianceRate}%
                                </Badge>
                            </div>
                        </div>
                        <div className="pt-2 space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">Export as:</p>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('sla-summary', 'xlsx')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={File02Icon} size={16} className="mr-1" />
                                    {exporting === 'sla-summary-xlsx' ? 'Exporting...' : 'Excel'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('sla-summary', 'pdf')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={File01Icon} size={16} className="mr-1" />
                                    {exporting === 'sla-summary-pdf' ? 'Exporting...' : 'PDF'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('sla-summary', 'md')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={Download01Icon} size={16} className="mr-1" />
                                    {exporting === 'sla-summary-md' ? 'Exporting...' : 'MD'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Developer Performance Report */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-primary" />
                            <CardTitle>Developer Performance</CardTitle>
                        </div>
                        <CardDescription>
                            Individual developer metrics and team comparison
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Team Members:</span>
                                <span className="font-medium">{developerData.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg Compliance:</span>
                                <span className="font-medium">
                                    {developerData.length > 0 
                                        ? (developerData.reduce((sum, d) => sum + d.complianceRate, 0) / developerData.length).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">Export as:</p>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('developer-performance', 'xlsx')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={File02Icon} size={16} className="mr-1" />
                                    {exporting === 'developer-performance-xlsx' ? 'Exporting...' : 'Excel'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('developer-performance', 'pdf')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={File01Icon} size={16} className="mr-1" />
                                    {exporting === 'developer-performance-pdf' ? 'Exporting...' : 'PDF'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('developer-performance', 'md')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={Download01Icon} size={16} className="mr-1" />
                                    {exporting === 'developer-performance-md' ? 'Exporting...' : 'MD'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Issue Status Report */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={CheckListIcon} size={20} className="text-primary" />
                            <CardTitle>Issue Status Report</CardTitle>
                        </div>
                        <CardDescription>
                            Detailed list of all issues with SLA status and timing
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Issues:</span>
                                <span className="font-medium">{issueData.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">With Details:</span>
                                <span className="font-medium">Priority, Status, Timing</span>
                            </div>
                        </div>
                        <div className="pt-2 space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">Export as:</p>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('issue-status', 'xlsx')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={File02Icon} size={16} className="mr-1" />
                                    {exporting === 'issue-status-xlsx' ? 'Exporting...' : 'Excel'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('issue-status', 'pdf')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={File01Icon} size={16} className="mr-1" />
                                    {exporting === 'issue-status-pdf' ? 'Exporting...' : 'PDF'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleExport('issue-status', 'md')}
                                    disabled={exporting !== null}
                                >
                                    <HugeiconsIcon icon={Download01Icon} size={16} className="mr-1" />
                                    {exporting === 'issue-status-md' ? 'Exporting...' : 'MD'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Info Box */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <HugeiconsIcon icon={AlertCircleIcon} size={20} className="text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">Export Information</p>
                            <p className="text-sm text-blue-800">
                                Reports are generated with current data and include timestamps. Excel files provide the most detailed data,
                                PDFs are best for printing and sharing, and Markdown files can be committed to version control or wikis.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Export Alert Dialog */}
            <AlertDialog open={exportAlert !== null} onOpenChange={(open) => !open && setExportAlert(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {exportAlert?.type === 'error' ? (
                                <>
                                    <HugeiconsIcon icon={AlertCircleIcon} size={20} className="text-destructive" />
                                    Export Failed
                                </>
                            ) : (
                                <>
                                    <HugeiconsIcon icon={AlertCircleIcon} size={20} className="text-amber-500" />
                                    No Data Available
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {exportAlert?.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setExportAlert(null)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

