import { useEffect, useState } from 'react'
import { getIssueChangelog } from '@/lib/jira/api'
import { HugeiconsIcon } from '@hugeicons/react'
import { Clock04Icon, UserIcon, Calendar01Icon } from '@hugeicons/core-free-icons'

interface ChangelogEntry {
    id: string
    created: string
    author: {
        displayName: string
        emailAddress?: string
    }
    items: Array<{
        field: string
        fieldtype: string
        from: string | null
        fromString: string | null
        to: string | null
        toString: string | null
    }>
}

interface IssueChangelogProps {
    issueKey: string
}

export function IssueChangelog({ issueKey }: IssueChangelogProps) {
    const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        async function fetchChangelog() {
            try {
                setLoading(true)
                setError(null)
                const data = await getIssueChangelog(issueKey)
                if (mounted && data?.values) {
                    setChangelog(data.values)
                }
            } catch (err: any) {
                if (mounted) {
                    console.error('Failed to fetch changelog:', err)
                    setError(err.message || 'Failed to load issue history')
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchChangelog()

        return () => {
            mounted = false
        }
    }, [issueKey])

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-sm text-muted-foreground p-4">
                {error}
            </div>
        )
    }

    if (!changelog || changelog.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4">
                No history available for this issue.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
                <HugeiconsIcon icon={Clock04Icon} size={16} />
                <span>Change History ({changelog.length})</span>
            </div>

            <div className="space-y-3">
                {changelog.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-muted pl-4 pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 text-sm">
                                <HugeiconsIcon icon={UserIcon} size={12} className="text-muted-foreground" />
                                <span className="font-medium">{entry.author.displayName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <HugeiconsIcon icon={Calendar01Icon} size={12} />
                                <time>{new Date(entry.created).toLocaleString()}</time>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {entry.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                    <span className="font-medium text-muted-foreground">{item.field}: </span>
                                    {item.fromString && (
                                        <>
                                            <span className="line-through text-red-600">{item.fromString}</span>
                                            <span className="mx-2">→</span>
                                        </>
                                    )}
                                    <span className="text-green-600">{item.toString || '(empty)'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
