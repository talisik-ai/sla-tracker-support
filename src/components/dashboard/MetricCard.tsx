import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
    title: string
    value: number | string
    status?: 'critical' | 'warning' | 'success' | 'neutral'
    icon?: React.ReactNode
    trend?: {
        direction: 'up' | 'down'
        percentage: number
    }
    className?: string
    onClick?: () => void
}

export function MetricCard({
    title,
    value,
    status = 'neutral',
    icon,
    trend,
    className,
    onClick
}: MetricCardProps) {
    const statusColors = {
        critical: "text-red-600",
        warning: "text-amber-500",
        success: "text-green-600",
        neutral: "text-foreground"
    }

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all hover:shadow-md",
                onClick && "cursor-pointer active:scale-95",
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", statusColors[status])}>
                    {value}
                </div>
                {trend && (
                    <p className="text-xs text-muted-foreground mt-1">
                        <span className={cn(
                            trend.direction === 'up' ? "text-green-600" : "text-red-600",
                            "font-medium"
                        )}>
                            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
                        </span>
                        {' '}from last period
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
