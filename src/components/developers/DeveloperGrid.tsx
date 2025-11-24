import { DeveloperCard } from './DeveloperCard'
import { DeveloperPerformance, getTeamAverages } from '@/lib/sla/developer-performance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface DeveloperGridProps {
    developers: DeveloperPerformance[]
}

export function DeveloperGrid({ developers }: DeveloperGridProps) {
    const averages = getTeamAverages(developers)

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Team Overview */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{developers.length}</div>
                        <p className="text-xs text-muted-foreground">Active developers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${averages.avgComplianceRate >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {averages.avgComplianceRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Target: 90%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {averages.avgResponseTime < 60
                                ? `${averages.avgResponseTime.toFixed(0)}m`
                                : `${(averages.avgResponseTime / 60).toFixed(1)}h`}
                        </div>
                        <p className="text-xs text-muted-foreground">First response time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averages.avgResolutionTime.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">Time to resolve</p>
                    </CardContent>
                </Card>
            </div>

            {/* Developer Grid */}
            <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Individual Performance</h2>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {developers.map(dev => (
                        <DeveloperCard
                            key={dev.accountId}
                            developer={dev}
                            teamAverageCompliance={averages.avgComplianceRate}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
