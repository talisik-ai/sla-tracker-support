import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JiraIssue, SLAData } from '@/lib/jira/types'
import { ExternalLink, Upload, Check, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { validateCustomFieldsConfigured } from '@/lib/jira/custom-fields'
import { syncSLAToJira as performSync } from '@/lib/jira/sla-sync'

interface IssueDetailModalProps {
    issue: JiraIssue | null
    sla: SLAData | null
    isOpen: boolean
    onClose: () => void
}

export function IssueDetailModal({ issue, sla, isOpen, onClose }: IssueDetailModalProps) {
    if (!issue || !sla) return null

    const jiraUrl = `${import.meta.env.VITE_JIRA_INSTANCE_URL}/browse/${issue.key}`
    const [syncing, setSyncing] = useState(false)
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [syncError, setSyncError] = useState<string | null>(null)
    const customFieldsConfigured = validateCustomFieldsConfigured()

    // Helper to render rich text content (handles both string and ADF object)
    const renderRichText = (content: string | any) => {
        if (!content) return null;
        if (typeof content === 'string') return content;
        // For ADF objects (Jira API v3), we'll just show a placeholder for now
        // or try to extract text if it's simple.
        // A full ADF renderer is complex.
        return (
            <span className="italic text-muted-foreground">
                (Rich text content - <a href={jiraUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">view in Jira</a>)
            </span>
        );
    };

    const handleSyncToJira = async () => {
        setSyncing(true)
        setSyncStatus('idle')
        setSyncError(null)

        try {
            const result = await performSync(issue.key, sla)

            if (result.success) {
                setSyncStatus('success')
            } else {
                setSyncStatus('error')
                setSyncError(result.error || 'Failed to sync to Jira')
            }
        } catch (error: any) {
            setSyncStatus('error')
            setSyncError(error.message)
        } finally {
            setSyncing(false)
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <span className="font-mono">{issue.key}</span>
                        <Badge
                            variant={
                                issue.fields.priority.name === 'Critical' ? 'destructive' :
                                    issue.fields.priority.name === 'High' ? 'default' :
                                        'secondary'
                            }
                        >
                            {issue.fields.priority.name}
                        </Badge>
                        <Badge variant="outline">{issue.fields.status.name}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Issue Summary */}
                    <div>
                        <h3 className="text-lg font-semibold">{issue.fields.summary}</h3>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Assignee:</span>
                            <div className="font-medium">{issue.fields.assignee?.displayName || 'Unassigned'}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Reporter:</span>
                            <div className="font-medium">{issue.fields.reporter.displayName}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Type:</span>
                            <div className="font-medium">{issue.fields.issuetype.name}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="font-medium">{issue.fields.status.name}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Created:</span>
                            <div className="font-medium">{new Date(issue.fields.created).toLocaleString()}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Updated:</span>
                            <div className="font-medium">{new Date(issue.fields.updated).toLocaleString()}</div>
                        </div>
                        {issue.fields.resolutiondate && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Resolved:</span>
                                <div className="font-medium">{new Date(issue.fields.resolutiondate).toLocaleString()}</div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {issue.fields.description && (
                        <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <div className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">
                                {renderRichText(issue.fields.description)}
                            </div>
                        </div>
                    )}

                    {/* SLA Status */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold">SLA Status</h4>

                        {/* First Response SLA */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">First Response SLA:</span>
                                <span className={`font-medium ${sla.hasFirstResponse
                                        ? sla.firstResponseStatus === 'met' ? 'text-green-600' : 'text-red-600'
                                        : sla.firstResponseStatus === 'breached' ? 'text-red-600'
                                            : sla.firstResponseStatus === 'at-risk' ? 'text-yellow-600'
                                                : 'text-green-600'
                                    }`}>
                                    {sla.hasFirstResponse
                                        ? `Responded in ${Math.round(sla.firstResponseTimeElapsed / 60)}h`
                                        : sla.firstResponseStatus === 'breached' ? 'Breached'
                                            : sla.firstResponseStatus === 'at-risk' ? 'At Risk'
                                                : 'On Track'
                                    }
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all ${sla.firstResponsePercentageUsed > 100 ? 'bg-red-600' :
                                            sla.firstResponsePercentageUsed > 75 ? 'bg-yellow-500' :
                                                'bg-green-600'
                                        }`}
                                    style={{ width: `${Math.min(sla.firstResponsePercentageUsed, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{Math.round(sla.firstResponseTimeElapsed / 60)} hours elapsed</span>
                                <span>
                                    {sla.hasFirstResponse
                                        ? `Met (${Math.round(sla.firstResponsePercentageUsed)}%)`
                                        : sla.firstResponseTimeRemaining > 0
                                            ? `${Math.round(sla.firstResponseTimeRemaining / 60)} hours remaining`
                                            : 'Overdue'
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Resolution SLA */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Resolution SLA:</span>
                                <span className={`font-medium ${sla.isResolved
                                    ? sla.resolutionStatus === 'met' ? 'text-green-600' : 'text-red-600'
                                    : sla.isBreached ? 'text-red-600' : sla.isAtRisk ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                    {sla.isResolved
                                        ? sla.resolutionStatus === 'met' ? 'Met' : 'Breached'
                                        : sla.isBreached ? 'Breached' : sla.isAtRisk ? 'At Risk' : 'On Track'
                                    }
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all ${sla.resolutionPercentageUsed > 100 ? 'bg-red-600' :
                                        sla.resolutionPercentageUsed > 75 ? 'bg-yellow-500' :
                                            'bg-green-600'
                                        }`}
                                    style={{ width: `${Math.min(sla.resolutionPercentageUsed, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{Math.round(sla.resolutionTimeElapsed / 60)} hours elapsed</span>
                                <span>
                                    {sla.isResolved
                                        ? 'Resolved'
                                        : sla.resolutionTimeRemaining > 0
                                            ? `${Math.round(sla.resolutionTimeRemaining / 60)} hours remaining`
                                            : `${Math.abs(Math.round(sla.resolutionTimeRemaining / 60))} hours overdue`
                                    }
                                </span>
                            </div>
                        </div>

                        {/* First Response SLA */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">First Response SLA:</span>
                                <span className={`font-medium ${sla.hasFirstResponse
                                    ? sla.firstResponseStatus === 'met' ? 'text-green-600' : 'text-red-600'
                                    : sla.firstResponsePercentageUsed > 100 ? 'text-red-600' : sla.firstResponsePercentageUsed > 75 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                    {sla.hasFirstResponse
                                        ? sla.firstResponseStatus === 'met' ? 'Met' : 'Breached'
                                        : sla.firstResponsePercentageUsed > 100 ? 'Breached' : sla.firstResponsePercentageUsed > 75 ? 'At Risk' : 'On Track'
                                    }
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all ${sla.firstResponsePercentageUsed > 100 ? 'bg-red-600' :
                                        sla.firstResponsePercentageUsed > 75 ? 'bg-yellow-500' :
                                            'bg-green-600'
                                        }`}
                                    style={{ width: `${Math.min(sla.firstResponsePercentageUsed, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{Math.round(sla.firstResponseTimeElapsed / 60)} hours elapsed</span>
                                <span>
                                    {sla.hasFirstResponse
                                        ? 'Responded'
                                        : sla.firstResponseTimeRemaining > 0
                                            ? `${Math.round(sla.firstResponseTimeRemaining / 60)} hours remaining`
                                            : `${Math.abs(Math.round(sla.firstResponseTimeRemaining / 60))} hours overdue`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Labels and Components */}
                    {(issue.fields.labels.length > 0 || issue.fields.components.length > 0) && (
                        <div className="space-y-2">
                            {issue.fields.labels.length > 0 && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Labels:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {issue.fields.labels.map(label => (
                                            <Badge key={label} variant="secondary" className="text-xs">
                                                {label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {issue.fields.components.length > 0 && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Components:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {issue.fields.components.map(component => (
                                            <Badge key={component.name} variant="outline" className="text-xs">
                                                {component.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comments */}
                    {issue.fields.comment.comments.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-3">Comments ({issue.fields.comment.comments.length})</h4>
                            <div className="space-y-3">
                                {issue.fields.comment.comments.map(comment => (
                                    <div key={comment.id} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm">{comment.author.displayName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(comment.created).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap">{renderRichText(comment.body)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-4 border-t">
                        {/* Sync Status Feedback */}
                        {syncStatus === 'success' && (
                            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4" />
                                SLA data synced to Jira successfully!
                            </div>
                        )}
                        {syncStatus === 'error' && (
                            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {syncError || 'Failed to sync to Jira'}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between">
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <a href={jiraUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                        Open in Jira
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                                {customFieldsConfigured && (
                                    <Button
                                        variant="secondary"
                                        onClick={handleSyncToJira}
                                        disabled={syncing}
                                        className="flex items-center gap-2"
                                    >
                                        {syncing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                                                Syncing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4" />
                                                Sync to Jira
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                            <Button onClick={onClose}>Close</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
