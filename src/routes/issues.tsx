import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SLATimer } from '@/components/issues/SLATimer'
import { IssueDetailModal } from '@/components/issues/IssueDetailModal'
import { calculateSLA } from '@/lib/sla/calculator'
import { MOCK_ISSUES } from '@/lib/jira/mock'
import { getAllProjectIssues } from '@/lib/jira/api'
import { useSLAStore } from '@/lib/sla/store'
import { JiraIssue, SLAData } from '@/lib/jira/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, SlidersHorizontalIcon, ArrowUpDownIcon } from '@hugeicons/core-free-icons'
import { SSEClient } from '@/lib/events/sse-client'
import { useNotificationStore } from '@/lib/notifications/store'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'


export const Route = createFileRoute('/issues')({
    component: IssuesPage,
    validateSearch: (search: Record<string, unknown>): {
        assignee?: string,
        name?: string,
        activeTab?: TabType,
        page?: number
    } => {
        return {
            assignee: search.assignee as string | undefined,
            name: search.name as string | undefined,
            activeTab: search.activeTab as TabType | undefined,
            page: Number(search.page) || 1,
        }
    },
})

type TabType = 'all' | 'highest' | 'high' | 'medium' | 'low' | 'lowest' | 'at-risk' | 'breached' | 'pending-response'

const ITEMS_PER_PAGE = 50 // Production-ready pagination

function IssuesPage() {
    const { assignee, name, activeTab: searchTab, page: searchPage } = Route.useSearch()
    const navigate = Route.useNavigate()
    const [issues, setIssues] = React.useState<Array<{ issue: JiraIssue, sla: SLAData }>>([])
    const [loading, setLoading] = React.useState(true)
    const [activeTab, setActiveTab] = React.useState<TabType>(searchTab || 'all')
    const [currentPage, setCurrentPage] = React.useState(searchPage || 1)
    const [sortBy, setSortBy] = React.useState<'key' | 'summary' | 'priority' | 'status' | 'assignee' | 'created' | 'sla'>('sla')
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

    // Get settings from store
    const settings = useSLAStore((state) => state)

    // Sync activeTab with search param if it changes
    React.useEffect(() => {
        if (searchTab) {
            setActiveTab(searchTab)
        }
    }, [searchTab])

    // Sync currentPage with search param if it changes
    React.useEffect(() => {
        if (searchPage) setCurrentPage(searchPage)
    }, [searchPage])

    const [searchQuery, setSearchQuery] = React.useState('')
    const [selectedIssue, setSelectedIssue] = React.useState<{ issue: JiraIssue, sla: SLAData } | null>(null)
    const sseClientRef = React.useRef<SSEClient | null>(null)
    const { addNotification } = useNotificationStore()

    const store = useSLAStore()
    const projectKey = store.projectKey

    React.useEffect(() => {
        async function loadData() {
            try {
                let fetchedIssues: JiraIssue[] = []

                console.log('[Issues] Fetching from Jira API via server proxy...')
                try {
                    fetchedIssues = await getAllProjectIssues(projectKey)
                    console.log(`[Issues] Successfully fetched ${fetchedIssues.length} issues from Jira`)
                } catch (apiError: any) {
                    console.error('[Issues] Jira API Error:', apiError)
                    console.warn('[Issues] Falling back to mock data')
                    fetchedIssues = MOCK_ISSUES
                }

                const processed = fetchedIssues.map(issue => ({
                    issue,
                    sla: calculateSLA(issue, settings)
                }))
                setIssues(processed)
            } catch (error) {
                console.error("[Issues] Failed to load data", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()

        // Setup SSE for real-time updates
        const sseClient = new SSEClient('/api/events/stream')
        sseClientRef.current = sseClient

        sseClient.connect({
            'connected': (data) => {
                console.log('[Issues] Connected to SSE stream:', data.clientId)
            },
            'issue-created': (data) => {
                console.log('[Issues] New issue created:', data.issueKey)
                loadData() // Reload to get new issue
                addNotification({
                    type: 'success',
                    title: 'New Issue',
                    message: `${data.issueKey} was created`,
                    link: `/issues?search=${data.issueKey}`
                })
            },
            'issue-updated': (data) => {
                console.log('[Issues] Issue updated:', data.issueKey)
                setIssues(prev => {
                    const index = prev.findIndex(i => i.issue.key === data.issueKey)
                    if (index !== -1) {
                        // Optimistic update or reload
                        // For now, we just update the SLA if we have the full issue data in payload
                        if (data.issue) {
                            const updated = [...prev]
                            updated[index] = {
                                issue: data.issue,
                                sla: calculateSLA(data.issue, settings)
                            }
                            return updated
                        }
                        // If no issue data, better reload
                        loadData()
                        return prev
                    }
                    return prev
                })
                addNotification({
                    type: 'info',
                    title: 'Issue Updated',
                    message: `${data.issueKey} was updated`,
                    link: `/issues?search=${data.issueKey}`
                })
            },
            'issue-deleted': (data) => {
                console.log('[Issues] Issue deleted:', data.issueKey)
                setIssues(prev => prev.filter(i => i.issue.key !== data.issueKey))
                addNotification({
                    type: 'warning',
                    title: 'Issue Deleted',
                    message: `${data.issueKey} was deleted`
                })
            }
        })

        return () => {
            console.log('[Issues] Disconnecting SSE...')
            sseClient.disconnect()
        }
    }, [settings, projectKey, addNotification])

    // Filter issues based on active tab, search, and assignee
    const filteredIssues = React.useMemo(() => {
        let filtered = issues

        // Filter by assignee if present
        if (assignee) {
            filtered = filtered.filter(i => i.issue.fields.assignee?.accountId === assignee)
        }

        // Filter by tab
        switch (activeTab) {
            case 'highest':
                filtered = filtered.filter(i => i.issue.fields.priority.name === 'Highest')
                break
            case 'high':
                filtered = filtered.filter(i => i.issue.fields.priority.name === 'High')
                break
            case 'medium':
                filtered = filtered.filter(i => i.issue.fields.priority.name === 'Medium')
                break
            case 'low':
                filtered = filtered.filter(i => i.issue.fields.priority.name === 'Low')
                break
            case 'lowest':
                filtered = filtered.filter(i => i.issue.fields.priority.name === 'Lowest')
                break
            case 'pending-response':
                filtered = filtered.filter(i => !i.sla.hasFirstResponse && !i.sla.isResolved)
                break
            case 'at-risk':
                filtered = filtered.filter(i => i.sla.isAtRisk && !i.sla.isResolved)
                break
            case 'breached':
                filtered = filtered.filter(i => i.sla.isBreached)
                break
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(i =>
                i.issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.issue.fields.summary.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        return filtered
    }, [issues, activeTab, searchQuery, assignee])

    // Sort issues
    const sortedIssues = React.useMemo(() => {
        const sorted = [...filteredIssues]
        sorted.sort((a, b) => {
            let comparison = 0
            switch (sortBy) {
                case 'key':
                    comparison = a.issue.key.localeCompare(b.issue.key)
                    break
                case 'summary':
                    comparison = a.issue.fields.summary.localeCompare(b.issue.fields.summary)
                    break
                case 'priority':
                    const priorityOrder: Record<string, number> = { 'Highest': -1, 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Lowest': 4 }
                    comparison = (priorityOrder[a.issue.fields.priority.name] ?? 99) - (priorityOrder[b.issue.fields.priority.name] ?? 99)
                    break
                case 'status':
                    comparison = a.issue.fields.status.name.localeCompare(b.issue.fields.status.name)
                    break
                case 'assignee':
                    const aName = a.issue.fields.assignee?.displayName || 'Unassigned'
                    const bName = b.issue.fields.assignee?.displayName || 'Unassigned'
                    comparison = aName.localeCompare(bName)
                    break
                case 'created':
                    comparison = new Date(a.issue.fields.created).getTime() - new Date(b.issue.fields.created).getTime()
                    break
                case 'sla':
                    comparison = a.sla.resolutionPercentageUsed - b.sla.resolutionPercentageUsed
                    break
            }
            return sortDirection === 'asc' ? comparison : -comparison
        })
        return sorted
    }, [filteredIssues, sortBy, sortDirection])

    const handleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortDirection('desc')
        }
    }

    // Pagination Logic
    const totalPages = Math.ceil(sortedIssues.length / ITEMS_PER_PAGE)
    const paginatedIssues = React.useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return sortedIssues.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [sortedIssues, currentPage])

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1)
        navigate({ search: (prev) => ({ ...prev, page: 1 }), replace: true })
    }, [activeTab, searchQuery, assignee])

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        navigate({ search: (prev) => ({ ...prev, page: newPage }) })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const tabs: { id: TabType; label: string; count: number }[] = [
        { id: 'all', label: 'All Issues', count: issues.length },
        { id: 'highest', label: 'Highest', count: issues.filter(i => i.issue.fields.priority.name === 'Highest').length },
        { id: 'high', label: 'High', count: issues.filter(i => i.issue.fields.priority.name === 'High').length },
        { id: 'medium', label: 'Medium', count: issues.filter(i => i.issue.fields.priority.name === 'Medium').length },
        { id: 'low', label: 'Low', count: issues.filter(i => i.issue.fields.priority.name === 'Low').length },
        { id: 'lowest', label: 'Lowest', count: issues.filter(i => i.issue.fields.priority.name === 'Lowest').length },
        { id: 'pending-response', label: 'Pending Response', count: issues.filter(i => !i.sla.hasFirstResponse && !i.sla.isResolved).length },
        { id: 'at-risk', label: 'At Risk', count: issues.filter(i => i.sla.isAtRisk && !i.sla.isResolved).length },
        { id: 'breached', label: 'Breached', count: issues.filter(i => i.sla.isBreached).length },
    ]

    if (loading) {
        return <div className="p-8">Loading issues...</div>
    }

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-6 dashboard-bg min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Issues</h1>
                <p className="text-sm text-muted-foreground">View and manage all project issues</p>
            </div>

            {/* Active Filter Banner */}
            {assignee && (
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3 flex items-center justify-between text-blue-800">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Filtering by assignee:</span>
                        <span>{name || 'Developer'}</span>
                    </div>
                    <button
                        onClick={() => navigate({ to: '/issues', search: {} })}
                        className="text-sm hover:underline font-medium cursor-pointer"
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Sticky Filter Bar */}
            <div className="sticky top-14 z-40 bg-background pb-4 space-y-6 mb-6 pt-2">
                {/* Search */}
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search by issue key or summary..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 -mb-2 hide-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id)
                            navigate({ search: (prev) => ({ ...prev, activeTab: tab.id }) })
                        }}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer
                            ${activeTab === tab.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'}
                        `}
                    >
                        {tab.label}
                        <span className={`
                            ml-1 px-1.5 py-0.5 rounded-full text-xs
                            ${activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-background/50'}
                        `}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

                {/* Sort Controls - Desktop */}
                <div className="hidden md:flex gap-2 flex-wrap items-center">
                    <span className="text-sm text-muted-foreground mr-1">Sort by:</span>
                    <button
                        onClick={() => handleSort('sla')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${sortBy === 'sla' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                            }`}
                    >
                        SLA Status {sortBy === 'sla' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('key')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${sortBy === 'key' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                            }`}
                    >
                        Key {sortBy === 'key' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('priority')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${sortBy === 'priority' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                            }`}
                    >
                        Priority {sortBy === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('status')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${sortBy === 'status' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                            }`}
                    >
                        Status {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('assignee')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${sortBy === 'assignee' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                            }`}
                    >
                        Assignee {sortBy === 'assignee' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('created')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${sortBy === 'created' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                            }`}
                    >
                        Created {sortBy === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                </div>

                {/* Sort Controls - Mobile Drawer */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                                <HugeiconsIcon icon={ArrowUpDownIcon} size={16} className="mr-2" />
                                Sort: {sortBy === 'sla' ? 'SLA Status' : sortBy === 'key' ? 'Key' : sortBy === 'priority' ? 'Priority' : sortBy === 'status' ? 'Status' : sortBy === 'assignee' ? 'Assignee' : 'Created'}
                                {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[400px]">
                            <SheetHeader>
                                <SheetTitle>Sort Options</SheetTitle>
                                <SheetDescription>Choose how to sort the issues</SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-3 py-4">
                                <Button
                                    variant={sortBy === 'sla' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => handleSort('sla')}
                                >
                                    SLA Status {sortBy === 'sla' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </Button>
                                <Button
                                    variant={sortBy === 'key' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => handleSort('key')}
                                >
                                    Key {sortBy === 'key' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </Button>
                                <Button
                                    variant={sortBy === 'priority' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => handleSort('priority')}
                                >
                                    Priority {sortBy === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </Button>
                                <Button
                                    variant={sortBy === 'status' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => handleSort('status')}
                                >
                                    Status {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </Button>
                                <Button
                                    variant={sortBy === 'assignee' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => handleSort('assignee')}
                                >
                                    Assignee {sortBy === 'assignee' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </Button>
                                <Button
                                    variant={sortBy === 'created' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => handleSort('created')}
                                >
                                    Created {sortBy === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Issues List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {paginatedIssues.map(({ issue, sla }, index) => {
                    const priorityClass =
                        issue.fields.priority.name === 'Critical' || issue.fields.priority.name === 'Highest' ? 'priority-critical' :
                        issue.fields.priority.name === 'High' ? 'priority-high' :
                        issue.fields.priority.name === 'Medium' ? 'priority-medium' : 'priority-low'

                    const isUrgent = sla.isBreached || (sla.isAtRisk && !sla.isResolved)

                    return (
                        <Card
                            key={issue.id}
                            className={`
                                relative overflow-hidden
                                hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5
                                transition-all duration-200 cursor-pointer h-full flex flex-col
                                ${priorityClass}
                                ${isUrgent ? 'ring-1 ring-red-200 dark:ring-red-900/50' : ''}
                                animate-slide-up
                            `}
                            style={{ animationDelay: `${(index % 9) * 30}ms` }}
                            onClick={() => setSelectedIssue({ issue, sla })}
                        >
                            <CardContent className="p-4 sm:p-6 flex-1 flex flex-col pl-5">
                                <div className="flex flex-col gap-3 flex-1">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono font-semibold text-primary text-sm tracking-tight">{issue.key}</span>
                                            <Badge variant={
                                                issue.fields.priority.name === 'Critical' || issue.fields.priority.name === 'Highest' ? 'destructive' :
                                                    issue.fields.priority.name === 'High' ? 'default' :
                                                        'secondary'
                                            } className="text-[10px] px-2 py-0 h-5 font-medium">
                                                {issue.fields.priority.name}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                                {issue.fields.status.name}
                                            </span>
                                        </div>
                                        <h3 className="font-medium leading-tight text-sm sm:text-base line-clamp-2" style={{
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            hyphens: 'auto'
                                        }}>{issue.fields.summary}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                                                    {issue.fields.assignee?.displayName.charAt(0) || '?'}
                                                </div>
                                                <span className="truncate max-w-[120px] text-xs">{issue.fields.assignee?.displayName || 'Unassigned'}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground/70">
                                                {new Date(issue.fields.created).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full pt-1">
                                        <SLATimer
                                            deadlineHours={sla.resolutionDeadline}
                                            createdDate={sla.createdDate}
                                            resolvedDate={sla.resolutionDate}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {paginatedIssues.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 animate-slide-up">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 animate-slide-up stagger-1">No Issues Found</h3>
                        <p className="text-muted-foreground max-w-sm animate-slide-up stagger-2">
                            {searchQuery || activeTab !== 'all'
                                ? "No issues match your current filters. Try adjusting your search or filter criteria."
                                : "All clear! No issues to display."}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                    </Button>

                    <div className="flex items-center gap-1 text-sm font-medium mx-2">
                        Page {currentPage} of {totalPages}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                    </Button>
                </div>
            )}

            {/* Issue Detail Modal */}
            <IssueDetailModal
                issue={selectedIssue?.issue || null}
                sla={selectedIssue?.sla || null}
                isOpen={!!selectedIssue}
                onClose={() => setSelectedIssue(null)}
            />
        </div>
    )
}
