import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateSLA } from '@/lib/sla/calculator'
import { MOCK_ISSUES } from '@/lib/jira/mock'
import { getAllProjectIssues } from '@/lib/jira/api'
import { JiraIssue, SLAData, DeveloperPerformance } from '@/lib/jira/types'

import { useSLAStore } from '@/lib/sla/store'

export const Route = createFileRoute('/developers')({
  component: DevelopersPage,
})

function DevelopersPage() {
  const [developers, setDevelopers] = React.useState<DeveloperPerformance[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sortBy, setSortBy] = React.useState<'name' | 'active' | 'compliance' | 'responseTime' | 'resolutionTime'>('name')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [teamAverages, setTeamAverages] = React.useState<{
    avgResponseTime: number
    avgResolutionTime: number
    avgComplianceRate: number
  } | null>(null)

  // Get settings from store
  const settings = useSLAStore((state) => state)

  React.useEffect(() => {
    async function loadData() {
      try {
        let fetchedIssues: JiraIssue[] = []

        console.log('[Developers] Fetching from Jira API via server proxy...')
        try {
          fetchedIssues = await getAllProjectIssues()
          console.log(`[Developers] Successfully fetched ${fetchedIssues.length} issues from Jira`)
        } catch (apiError: any) {
          console.error('[Developers] Jira API Error:', apiError)
          console.error('[Developers] Error details:', {
            message: apiError.message,
            response: apiError.response?.data,
            status: apiError.response?.status
          })
          console.warn('[Developers] Falling back to mock data')
          fetchedIssues = MOCK_ISSUES
        }

        const processed = fetchedIssues.map(issue => ({
          issue,
          sla: calculateSLA(issue, settings)
        }))

        // Calculate developer performance
        const devMap = new Map<string, DeveloperPerformance>()

        processed.forEach(({ issue, sla }) => {
          if (!issue.fields.assignee) return

          const accountId = issue.fields.assignee.accountId
          if (!devMap.has(accountId)) {
            devMap.set(accountId, {
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
            } as DeveloperPerformance)
          }

          const dev = devMap.get(accountId)!

          if (!sla.isResolved) {
            dev.totalActiveIssues++
            switch (sla.priority) {
              case 'Critical': dev.criticalIssues++; break
              case 'High': dev.highIssues++; break
              case 'Medium': dev.mediumIssues++; break
              case 'Low': dev.lowIssues++; break
            }
            if (sla.isAtRisk) dev.atRiskIssues++
            if (sla.isBreached) dev.breachedIssues++
          } else {
            dev.totalResolvedIssues++
          }
        })

        // Calculate averages for each developer
        const developersWithMetrics = Array.from(devMap.values()).map(dev => {
          // Get all resolved issues for this developer
          const developerIssues = processed.filter(
            (i: { issue: JiraIssue; sla: SLAData }) => i.issue.fields.assignee?.accountId === dev.accountId
          )
          const resolvedIssues = developerIssues.filter((i: { issue: JiraIssue; sla: SLAData }) => i.sla.isResolved)

          // Calculate average first response time
          const issuesWithResponse = resolvedIssues.filter((i: { issue: JiraIssue; sla: SLAData }) => i.sla.hasFirstResponse)
          if (issuesWithResponse.length > 0) {
            const totalResponseTime = issuesWithResponse.reduce(
              (sum: number, i: { issue: JiraIssue; sla: SLAData }) => sum + i.sla.firstResponseTimeElapsed,
              0
            )
            dev.averageFirstResponseTime = Math.round((totalResponseTime / issuesWithResponse.length / 60) * 10) / 10
          }

          // Calculate average resolution time
          if (resolvedIssues.length > 0) {
            const totalResolutionTime = resolvedIssues.reduce(
              (sum: number, i: { issue: JiraIssue; sla: SLAData }) => sum + i.sla.resolutionTimeElapsed,
              0
            )
            dev.averageResolutionTime = Math.round((totalResolutionTime / resolvedIssues.length / 60) * 10) / 10
          }

          // Calculate SLA compliance rate
          if (resolvedIssues.length > 0) {
            const metSLA = resolvedIssues.filter((i: { issue: JiraIssue; sla: SLAData }) => i.sla.resolutionStatus === 'met').length
            dev.slaComplianceRate = Math.round((metSLA / resolvedIssues.length) * 100)
          }

          return dev
        })

        setDevelopers(developersWithMetrics)

        // Calculate team averages
        if (developersWithMetrics.length > 0) {
          const devsWithData = developersWithMetrics.filter(d => d.totalResolvedIssues > 0)
          if (devsWithData.length > 0) {
            const avgResponse = devsWithData.reduce((sum, d) => sum + d.averageFirstResponseTime, 0) / devsWithData.length
            const avgResolution = devsWithData.reduce((sum, d) => sum + d.averageResolutionTime, 0) / devsWithData.length
            const avgCompliance = devsWithData.reduce((sum, d) => sum + d.slaComplianceRate, 0) / devsWithData.length

            setTeamAverages({
              avgResponseTime: Math.round(avgResponse * 10) / 10,
              avgResolutionTime: Math.round(avgResolution * 10) / 10,
              avgComplianceRate: Math.round(avgCompliance)
            })
          }
        }
      } catch (error) {
        console.error("[Developers] Failed to load data", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Sort developers
  const sortedDevelopers = React.useMemo(() => {
    const sorted = [...developers]
    sorted.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName)
          break
        case 'active':
          comparison = a.totalActiveIssues - b.totalActiveIssues
          break
        case 'compliance':
          comparison = a.slaComplianceRate - b.slaComplianceRate
          break
        case 'responseTime':
          comparison = a.averageFirstResponseTime - b.averageFirstResponseTime
          break
        case 'resolutionTime':
          comparison = a.averageResolutionTime - b.averageResolutionTime
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [developers, sortBy, sortDirection])

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  if (loading) {
    return <div className="p-8">Loading developers...</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Developer Performance</h1>
      </div>

      {/* Team Averages Card */}
      {teamAverages && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              📈 Team Averages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">SLA Compliance</div>
                <div className="text-2xl font-bold text-green-600">{teamAverages.avgComplianceRate}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className="text-2xl font-bold text-blue-600">{teamAverages.avgResponseTime}h</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Resolution Time</div>
                <div className="text-2xl font-bold text-purple-600">{teamAverages.avgResolutionTime}h</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort Controls */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground self-center">Sort by:</span>
        <button
          onClick={() => handleSort('name')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'name' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
            }`}
        >
          Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('active')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'active' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
            }`}
        >
          Active Issues {sortBy === 'active' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('compliance')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'compliance' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
            }`}
        >
          Compliance {sortBy === 'compliance' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('responseTime')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'responseTime' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
            }`}
        >
          Response Time {sortBy === 'responseTime' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('resolutionTime')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${sortBy === 'resolutionTime' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
            }`}
        >
          Resolution Time {sortBy === 'resolutionTime' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Developer Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedDevelopers.map((dev) => (
          <Card
            key={dev.accountId}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => window.location.href = `/issues?assignee=${dev.accountId}&name=${encodeURIComponent(dev.displayName)}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {dev.displayName.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-lg">{dev.displayName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {dev.totalActiveIssues} active issue{dev.totalActiveIssues !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active Issues by Priority */}
              <div>
                <div className="text-sm font-medium mb-2">Active Issues</div>
                <div className="flex gap-2 flex-wrap">
                  {dev.criticalIssues > 0 && (
                    <Badge variant="destructive">
                      {dev.criticalIssues} Critical
                    </Badge>
                  )}
                  {dev.highIssues > 0 && (
                    <Badge className="bg-orange-500 hover:bg-orange-600">
                      {dev.highIssues} High
                    </Badge>
                  )}
                  {dev.mediumIssues > 0 && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                      {dev.mediumIssues} Medium
                    </Badge>
                  )}
                  {dev.lowIssues > 0 && (
                    <Badge variant="secondary">
                      {dev.lowIssues} Low
                    </Badge>
                  )}
                </div>
              </div>

              {/* SLA Status */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">At Risk</div>
                  <div className="text-2xl font-bold text-amber-600">
                    {dev.atRiskIssues}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Breached</div>
                  <div className="text-2xl font-bold text-red-600">
                    {dev.breachedIssues}
                  </div>
                </div>
              </div>

              {/* Resolved */}
              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground">Total Resolved</div>
                <div className="text-lg font-semibold text-green-600">
                  {dev.totalResolvedIssues}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {developers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No developer data available
        </div>
      )}
    </div>
  )
}
