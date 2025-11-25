import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'

interface ComplianceDataPoint {
    date: string
    compliance: number
    total: number
}

interface SLAComplianceChartProps {
    data: ComplianceDataPoint[]
}

const chartConfig = {
    compliance: {
        label: 'Compliance Rate',
        color: 'hsl(142, 76%, 36%)', // green
    },
}

export const SLAComplianceChart = React.memo(function SLAComplianceChart({ data }: SLAComplianceChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>SLA Compliance Trend</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No historical data available</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>SLA Compliance Trend</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                label={{ value: 'Compliance %', angle: -90, position: 'insideLeft' }}
                            />
                            {/* Reference lines for targets */}
                            <ReferenceLine
                                y={90}
                                stroke="hsl(142, 76%, 36%)"
                                strokeDasharray="3 3"
                                label={{ value: 'Target 90%', position: 'right', fill: 'hsl(142, 76%, 36%)' }}
                            />
                            <ReferenceLine
                                y={75}
                                stroke="hsl(48, 96%, 53%)"
                                strokeDasharray="3 3"
                                label={{ value: 'Warning 75%', position: 'right', fill: 'hsl(48, 96%, 53%)' }}
                            />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    const data = payload[0].payload as ComplianceDataPoint
                                    return (
                                        <ChartTooltipContent hideLabel>
                                            <div className="flex flex-col gap-1">
                                                <div className="font-medium">{data.date}</div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Compliance:</span>
                                                    <span className="font-medium">{data.compliance.toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Total Issues:</span>
                                                    <span className="font-medium">{data.total}</span>
                                                </div>
                                            </div>
                                        </ChartTooltipContent>
                                    )
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="compliance"
                                stroke="hsl(142, 76%, 36%)"
                                fillOpacity={1}
                                fill="url(#colorCompliance)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
})
