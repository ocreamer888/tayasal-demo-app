import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MetricCardProps extends React.ComponentProps<"div"> {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
}

function MetricCard({
  title,
  value,
  trend,
  description,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      data-slot="metric-card"
      className={cn(
        // Premium gradient background with green accent bar
        "relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-white to-green-50 p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {/* Left green accent gradient bar */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-green-500 to-green-600" />

      <div className="relative pl-4">
        {/* Label - uppercase with letter spacing */}
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {title}
        </div>

        {/* Value - large, bold, tabular numbers */}
        <div
          className={cn(
            "mt-2 font-bold text-neutral-900",
            typeof value === "number" && value >= 1000 ? "text-4xl" : "text-5xl"
          )}
          style={{ lineHeight: 1 }}
        >
          {typeof value === "number" ? (
            <span className="tabular-nums">{value.toLocaleString()}</span>
          ) : (
            value
          )}
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-1 text-sm font-semibold",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span className={cn(trend.isPositive ? "" : "")}>
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          </div>
        )}

        {/* Optional description */}
        {description && (
          <p className="mt-2 text-sm text-neutral-500">{description}</p>
        )}
      </div>
    </div>
  )
}

export { MetricCard }
