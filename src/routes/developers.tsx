import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DeveloperGrid } from '@/components/developers/DeveloperGrid'
import { calculateDeveloperPerformance } from '@/lib/sla/developer-performance'
import { getAllProjectIssues } from '@/lib/jira/api'
import { calculateSLA } from '@/lib/sla/calculator'
import { useSLAStore } from '@/lib/sla/store'
import { JiraIssue, SLAData } from '@/lib/jira/types'
import { MOCK_ISSUES } from '@/lib/jira/mock'

export const Route = createFileRoute('/developers')({
  component: DevelopersPage,
})

function DevelopersPage() {
  const [issues, setIssues] = React.useState<Array<{ issue: JiraIssue, sla: SLAData }>>([])
  const [loading, setLoading] = React.useState(true)

  const store = useSLAStore()
  const projectKey = store.projectKey
  const settings = useSLAStore((state) => state)

  React.useEffect(() => {
    async function loadData() {
      try {
        let fetchedIssues: JiraIssue[] = []
        try {
          console.log('[Developers] Fetching issues for project:', projectKey)
          fetchedIssues = await getAllProjectIssues(projectKey)
          console.log(`[Developers] Successfully fetched ${fetchedIssues.length} issues`)
        } catch (apiError) {
          console.error('[Developers] Jira API Error:', apiError)
          console.warn('[Developers] Falling back to MOCK_ISSUES due to API error')
          fetchedIssues = MOCK_ISSUES
        }

        const processed = fetchedIssues.map(issue => ({
          issue,
          sla: calculateSLA(issue, settings)
        }))
        setIssues(processed)
      } catch (error) {
        console.error("[Developers] Failed to load data", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectKey, settings])

  // Dynamic team members from fetched issues
  const developerPerformance = React.useMemo(() => {
    // Extract unique assignees from issues
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

    // If no developers found (e.g. all unassigned), fallback to mock team for demo purposes
    // Check if we are using mock data by checking if the first issue matches a mock issue key
    const isMockData = issues.length > 0 && issues[0].issue.key.startsWith('SAL-')

    if (developers.length === 0 && isMockData) {
      return calculateDeveloperPerformance(issues, [
        { accountId: '712020:6a60519f-4318-4d04-8028-22874130099e', displayName: 'Alyssa', avatarUrl: '' },
        { accountId: '712020:c7183664-500e-43c3-9828-565d7023199c', displayName: 'Kim', avatarUrl: '' },
        { accountId: '712020:80453308-5969-451e-b816-524675762699', displayName: 'Keen', avatarUrl: '' },
        { accountId: '712020:e9423642-1718-472e-9e7f-68211043239a', displayName: 'Mabel', avatarUrl: '' },
      ])
    }

    return calculateDeveloperPerformance(issues, developers)
  }, [issues])

  if (loading) {
    return <div className="p-8">Loading developer metrics...</div>
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Developer Performance</h1>
        <p className="text-sm text-muted-foreground">Monitor team workload and SLA compliance metrics</p>
      </div>

      <DeveloperGrid developers={developerPerformance} />
    </div>
  )
}
