import { DeveloperCard } from './DeveloperCard'
import { DeveloperPerformance, getTeamAverages } from '@/lib/sla/developer-performance'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserGroupIcon, ChartIncreaseIcon, Clock01Icon, CheckmarkCircle01Icon, PlayCircleIcon } from '@hugeicons/core-free-icons'

interface DeveloperGridProps {
    developers: DeveloperPerformance[]
}

export function DeveloperGrid({ developers }: DeveloperGridProps) {
    const averages = getTeamAverages(developers)

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Team Overview */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
                <MetricCard
                    title="Team Members"
                    value={developers.length}
                    subtitle="Active developers"
                    icon={<HugeiconsIcon icon={UserGroupIcon} size={16} />}
                />
                <MetricCard
                    title="Avg Compliance"
                    value={`${averages.avgComplianceRate.toFixed(1)}%`}
                    subtitle="Target: 90%"
                    icon={<HugeiconsIcon icon={ChartIncreaseIcon} size={16} />}
                    status={averages.avgComplianceRate >= 90 ? 'success' : 'warning'}
                />
                <MetricCard
                    title="Avg Response"
                    value={averages.avgResponseTime < 60
                        ? `${averages.avgResponseTime.toFixed(0)}m`
                        : `${(averages.avgResponseTime / 60).toFixed(1)}h`}
                    subtitle="First response time"
                    icon={<HugeiconsIcon icon={Clock01Icon} size={16} />}
                />
                <MetricCard
                    title="Avg Start"
                    value={averages.avgStartTime < 60
                        ? `${averages.avgStartTime.toFixed(0)}m`
                        : `${(averages.avgStartTime / 60).toFixed(1)}h`}
                    subtitle="Time to start"
                    icon={<HugeiconsIcon icon={PlayCircleIcon} size={16} />}
                />
                <MetricCard
                    title="Avg Resolution"
                    value={`${averages.avgResolutionTime.toFixed(1)}h`}
                    subtitle="Time to resolve"
                    icon={<HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />}
                />
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
