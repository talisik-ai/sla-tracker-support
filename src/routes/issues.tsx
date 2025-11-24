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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { MultiSelect } from '@/components/ui/multi-select'
import { DateRange } from 'react-day-picker'
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns'


export const Route = createFileRoute('/issues')({
    component: IssuesPage,
    validateSearch: (search: Record<string, unknown>): {
        assignee?: string,
        name?: string,
        activeTab?: TabType,
        page?: number,
        priorities?: string[],
        from?: string,
        to?: string
    } => {
        return {
            assignee: search.assignee as string | undefined,
            name: search.name as string | undefined,
            activeTab: search.activeTab as TabType | undefined,
            page: Number(search.page) || 1,
            priorities: Array.isArray(search.priorities) ? search.priorities as string[] : search.priorities ? [search.priorities as string] : undefined,
            from: search.from as string | undefined,
            to: search.to as string | undefined,
        }
    },
})

type TabType = 'all' | 'highest' | 'high' | 'medium' | 'low' | 'lowest' | 'at-risk' | 'breached' | 'pending-response'

const ITEMS_PER_PAGE = 50 // Production-ready pagination

function IssuesPage() {
    const { assignee, name, activeTab: searchTab, page: searchPage, priorities: searchPriorities, from: searchFrom, to: searchTo } = Route.useSearch()
    const navigate = Route.useNavigate()
    const [issues, setIssues] = React.useState<Array<{ issue: JiraIssue, sla: SLAData }>>([])
    const [loading, setLoading] = React.useState(true)
    const [activeTab, setActiveTab] = React.useState<TabType>(searchTab || 'all')
    const [currentPage, setCurrentPage] = React.useState(searchPage || 1)
    const [sortBy, setSortBy] = React.useState<'key' | 'summary' | 'priority' | 'status' | 'assignee' | 'created' | 'sla'>('sla')
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

    // Enhanced Filters State
    const [selectedPriorities, setSelectedPriorities] = React.useState<string[]>(searchPriorities || [])
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
        searchFrom && searchTo ? { from: new Date(searchFrom), to: new Date(searchTo) } : undefined
    )

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

    // Update URL when filters change
    const updateFilters = (newPriorities: string[], newDateRange: DateRange | undefined) => {
        setSelectedPriorities(newPriorities)
        setDateRange(newDateRange)
        setCurrentPage(1)

        navigate({
            search: (prev) => ({
                ...prev,
                page: 1,
                priorities: newPriorities.length > 0 ? newPriorities : undefined,
                from: newDateRange?.from?.toISOString(),
                to: newDateRange?.to?.toISOString()
            })
        })
    }

    const [searchQuery, setSearchQuery] = React.useState('')
    const [selectedIssue, setSelectedIssue] = React.useState<{ issue: JiraIssue, sla: SLAData } | null>(null)

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
    }, [settings, projectKey])

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

        // Filter by Priorities
        if (selectedPriorities.length > 0) {
            filtered = filtered.filter(i => selectedPriorities.includes(i.issue.fields.priority.name))
        }

        // Filter by Date Range (Created Date)
        if (dateRange?.from && dateRange?.to) {
            filtered = filtered.filter(i => {
                const created = new Date(i.issue.fields.created)
                return isWithinInterval(created, {
                    start: startOfDay(dateRange.from!),
                    end: endOfDay(dateRange.to!)
                })
            })
        }

        return filtered
    }, [issues, activeTab, searchQuery, assignee, selectedPriorities, dateRange])

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
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Issues</h1>
                <p className="text-muted-foreground">View and manage all project issues</p>
            </div>

            {/* Active Filter Banner */}
            {assignee && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center justify-between text-blue-800">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Filtering by assignee:</span>
                        <span>{name || 'Developer'}</span>
                    </div>
                    <button
                        onClick={() => navigate({ to: '/issues', search: {} })}
                        className="text-sm hover:underline font-medium"
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-4 flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Search by issue key or summary..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <div className="hidden md:flex items-center gap-2">
                        <DatePickerWithRange
                            date={dateRange}
                            onDateChange={(range) => updateFilters(selectedPriorities, range)}
                        />

                        <div className="w-[200px]">
                            <MultiSelect
                                options={[
                                    { value: 'Critical', label: 'Critical' },
                                    { value: 'High', label: 'High' },
                                    { value: 'Medium', label: 'Medium' },
                                    { value: 'Low', label: 'Low' },
                                ]}
                                selected={selectedPriorities}
                                onChange={(values) => updateFilters(values, dateRange)}
                                placeholder="Filter Priority"
                            />
                        </div>

                        {(selectedPriorities.length > 0 || dateRange) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateFilters([], undefined)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id)
                            navigate({ search: (prev) => ({ ...prev, activeTab: tab.id }) })
                        }}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
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

            {/* Sort Controls */}
            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <button
                    onClick={() => handleSort('sla')}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'sla' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                >
                    SLA Status {sortBy === 'sla' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    onClick={() => handleSort('key')}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'key' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                >
                    Key {sortBy === 'key' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    onClick={() => handleSort('priority')}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'priority' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                >
                    Priority {sortBy === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    onClick={() => handleSort('status')}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'status' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                >
                    Status {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    onClick={() => handleSort('assignee')}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'assignee' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                >
                    Assignee {sortBy === 'assignee' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    onClick={() => handleSort('created')}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'created' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                >
                    Created {sortBy === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
            </div>

            {/* Issues List */}
            <div className="grid gap-4">
                {paginatedIssues.map(({ issue, sla }) => (
                    <Card
                        key={issue.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedIssue({ issue, sla })}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium text-primary">{issue.key}</span>
                                        <Badge variant={
                                            issue.fields.priority.name === 'Critical' ? 'destructive' :
                                                issue.fields.priority.name === 'High' ? 'default' :
                                                    'secondary'
                                        }>
                                            {issue.fields.priority.name}
                                        </Badge>
                                        <Badge variant="outline">{issue.fields.status.name}</Badge>
                                    </div>
                                    <h3 className="font-medium leading-none">{issue.fields.summary}</h3>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                                {issue.fields.assignee?.displayName.charAt(0) || '?'}
                                            </div>
                                            <span>{issue.fields.assignee?.displayName || 'Unassigned'}</span>
                                        </div>
                                        <span>Created {new Date(issue.fields.created).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="w-48 shrink-0">
                                    <SLATimer
                                        deadlineHours={sla.resolutionDeadline}
                                        createdDate={sla.createdDate}
                                        resolvedDate={sla.resolutionDate}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {paginatedIssues.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No issues found matching your filters.
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
                        <ChevronLeft className="h-4 w-4" />
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
                        <ChevronRight className="h-4 w-4" />
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
