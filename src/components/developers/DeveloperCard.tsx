import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DeveloperPerformance } from '@/lib/sla/developer-performance'
import { Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

interface DeveloperCardProps {
    developer: DeveloperPerformance
    teamAverageCompliance: number
}

export function DeveloperCard({ developer, teamAverageCompliance }: DeveloperCardProps) {
    const navigate = useNavigate()

    const getComplianceColor = (rate: number) => {
        if (rate >= 90) return 'text-green-600'
        if (rate >= 75) return 'text-yellow-600'
        return 'text-red-600'
    }

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes.toFixed(0)}m`
        return `${(minutes / 60).toFixed(1)}h`
    }

    return (
        <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate({ to: '/issues', search: { assignee: developer.accountId } })}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                        {developer.avatarUrl ? (
                            <img src={developer.avatarUrl} alt={developer.displayName} className="h-full w-full object-cover" />
                        ) : (
                            developer.displayName.charAt(0)
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold">{developer.displayName}</CardTitle>
                        <p className="text-xs text-muted-foreground">{developer.totalActiveIssues} active issues</p>
                    </div>
                </div>
                <div className={`text-2xl font-bold ${getComplianceColor(developer.slaComplianceRate)}`}>
                    {developer.slaComplianceRate.toFixed(0)}%
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mt-2">
                    {/* Active Issues Breakdown */}
                    <div className="flex gap-2 text-xs">
                        {developer.criticalIssues > 0 && (
                            <Badge variant="destructive" className="h-5 px-1.5">
                                {developer.criticalIssues} Crit
                            </Badge>
                        )}
                        {developer.highIssues > 0 && (
                            <Badge variant="default" className="h-5 px-1.5 bg-orange-500 hover:bg-orange-600">
                                {developer.highIssues} High
                            </Badge>
                        )}
                        {developer.mediumIssues > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 bg-yellow-500 hover:bg-yellow-600 text-white">
                                {developer.mediumIssues} Med
                            </Badge>
                        )}
                        {developer.atRiskIssues > 0 && (
                            <Badge variant="outline" className="h-5 px-1.5 border-yellow-500 text-yellow-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {developer.atRiskIssues} Risk
                            </Badge>
                        )}
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Avg Response
                            </div>
                            <div className="font-semibold text-sm">
                                {formatDuration(developer.averageFirstResponseTime)}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Avg Resolution
                            </div>
                            <div className="font-semibold text-sm">
                                {developer.averageResolutionTime.toFixed(1)}h
                            </div>
                        </div>
                    </div>

                    {/* Compliance Progress */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>SLA Compliance</span>
                            <span>Target: 90%</span>
                        </div>
                        <Progress value={developer.slaComplianceRate} className="h-2" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
