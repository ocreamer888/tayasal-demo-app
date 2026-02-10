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
        "relative overflow-hidden rounded-xl bg-gradient-to-br from-white/20 to-white/30 backdrop-blur-sm border border-neutral-100/20 p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      {...props}
    >

      <div className="relative pl-4">
        {/* Label - uppercase with letter spacing */}
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
          {title}
        </div>

        {/* Value - large, bold, tabular numbers */}
        <div
          className={cn(
            "mt-2 font-bold text-neutral-200",
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
          <p className="mt-2 text-sm text-neutral-200">{description}</p>
        )}
      </div>
    </div>
  )
}

export { MetricCard }
