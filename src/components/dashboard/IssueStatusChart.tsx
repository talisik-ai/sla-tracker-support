import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface IssueStatusData {
    met: number
    atRisk: number
    breached: number
    pending: number
}

interface IssueStatusChartProps {
    data: IssueStatusData
}

const chartConfig = {
    met: {
        label: 'Met',
        color: 'hsl(142, 76%, 36%)', // green
    },
    atRisk: {
        label: 'At Risk',
        color: 'hsl(48, 96%, 53%)', // yellow
    },
    breached: {
        label: 'Breached',
        color: 'hsl(0, 84%, 60%)', // red
    },
    pending: {
        label: 'Pending',
        color: 'hsl(215, 20%, 65%)', // gray
    },
}

export const IssueStatusChart = React.memo(function IssueStatusChart({ data }: IssueStatusChartProps) {
    const chartData = [
        { name: 'Met', value: data.met, fill: chartConfig.met.color },
        { name: 'At Risk', value: data.atRisk, fill: chartConfig.atRisk.color },
        { name: 'Breached', value: data.breached, fill: chartConfig.breached.color },
        { name: 'Pending', value: data.pending, fill: chartConfig.pending.color },
    ].filter(item => item.value > 0) // Only show non-zero values

    const total = data.met + data.atRisk + data.breached + data.pending

    if (total === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Issue Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No data available</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Issue Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                labelLine={false}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    const data = payload[0]
                                    return (
                                        <ChartTooltipContent hideLabel>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: data.payload.fill }}
                                                    />
                                                    <span className="font-medium">{data.name}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Count:</span>
                                                    <span className="font-medium">{data.value}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Percentage:</span>
                                                    <span className="font-medium">
                                                        {((data.value as number / total) * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </ChartTooltipContent>
                                    )
                                }}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
})
