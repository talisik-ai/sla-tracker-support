import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { formatElapsedTime } from '@/lib/utils/time'

interface ResponseTimeData {
    priority: string
    avgTime: number
    target: number
    count: number
}

interface ResponseTimeChartProps {
    data: ResponseTimeData[]
}

const chartConfig = {
    avgTime: {
        label: 'Avg Response Time',
        color: 'hsl(217, 91%, 60%)', // blue
    },
    target: {
        label: 'Target',
        color: 'hsl(215, 20%, 65%)', // gray
    },
}

export const ResponseTimeChart = React.memo(function ResponseTimeChart({ data }: ResponseTimeChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Response Time by Priority</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No data available</p>
                </CardContent>
            </Card>
        )
    }

    // Determine bar color based on comparison to target
    const getBarColor = (avgTime: number, target: number) => {
        if (avgTime > target) return 'hsl(0, 84%, 60%)' // red - breached
        if (avgTime > target * 0.75) return 'hsl(48, 96%, 53%)' // yellow - at risk
        return 'hsl(142, 76%, 36%)' // green - good
    }

    const chartData = data.map(item => ({
        ...item,
        fill: getBarColor(item.avgTime, item.target),
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Response Time by Priority</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="priority"
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                            />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    const data = payload[0].payload as ResponseTimeData & { fill: string }
                                    return (
                                        <ChartTooltipContent hideLabel>
                                            <div className="flex flex-col gap-1">
                                                <div className="font-medium">{data.priority} Priority</div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Avg Response:</span>
                                                    <span className="font-medium">{formatElapsedTime(data.avgTime)}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Target:</span>
                                                    <span className="font-medium">{formatElapsedTime(data.target)}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Issues:</span>
                                                    <span className="font-medium">{data.count}</span>
                                                </div>
                                            </div>
                                        </ChartTooltipContent>
                                    )
                                }}
                            />
                            <Bar dataKey="avgTime" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
})
