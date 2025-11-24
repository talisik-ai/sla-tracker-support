import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Chart container component
const ChartContainer = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & {
        config: Record<string, { label: string; color?: string }>
        children: React.ReactElement
    }
>(({ className, children, config, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("w-full", className)}
            style={
                {
                    ...(Object.entries(config).reduce((acc, [key, value]) => {
                        if (value.color) {
                            acc[`--color-${key}`] = value.color
                        }
                        return acc
                    }, {} as Record<string, string>)),
                } as React.CSSProperties
            }
            {...props}
        >
            {children}
        </div>
    )
})
ChartContainer.displayName = "ChartContainer"

// Chart tooltip
const ChartTooltip = RechartsPrimitive.Tooltip

// Chart tooltip content
const ChartTooltipContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & {
        hideLabel?: boolean
        hideIndicator?: boolean
        indicator?: "line" | "dot" | "dashed"
        nameKey?: string
        labelKey?: string
    }
>(
    (
        {
            className,
            hideLabel = false,
            hideIndicator = false,
            indicator = "dot",
            nameKey,
            labelKey,
            ...props
        },
        ref
    ) => {
        const { active, payload, label } = props as any

        if (!active || !payload?.length) {
            return null
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-lg border bg-background p-2 shadow-md",
                    className
                )}
            >
                {!hideLabel && label && (
                    <div className="mb-2 font-medium text-sm">{label}</div>
                )}
                <div className="grid gap-1.5">
                    {payload.map((item: any, index: number) => {
                        const indicatorColor = item.color || item.fill || item.stroke

                        return (
                            <div
                                key={`${item.name}-${index}`}
                                className="flex items-center gap-2 text-sm"
                            >
                                {!hideIndicator && (
                                    <div
                                        className={cn(
                                            "h-2.5 w-2.5 shrink-0 rounded-full",
                                            indicator === "line" && "h-0.5 w-4",
                                            indicator === "dashed" && "h-0.5 w-4 border-t-2 border-dashed"
                                        )}
                                        style={{ backgroundColor: indicatorColor }}
                                    />
                                )}
                                <div className="flex flex-1 justify-between gap-2">
                                    <span className="text-muted-foreground">{item.name}</span>
                                    <span className="font-medium">{item.value}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

// Chart legend
const ChartLegend = RechartsPrimitive.Legend

// Chart legend content
const ChartLegendContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & {
        hideIcon?: boolean
        payload?: Array<{ value: string; color?: string; type?: string }>
    }
>(({ className, hideIcon = false, payload, ...props }, ref) => {
    if (!payload?.length) {
        return null
    }

    return (
        <div
            ref={ref}
            className={cn("flex items-center justify-center gap-4", className)}
            {...props}
        >
            {payload.map((item, index) => (
                <div
                    key={`legend-${index}`}
                    className="flex items-center gap-1.5 text-sm"
                >
                    {!hideIcon && (
                        <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                    )}
                    <span className="text-muted-foreground">{item.value}</span>
                </div>
            ))}
        </div>
    )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
}
