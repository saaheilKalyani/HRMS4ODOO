import type { ReactNode } from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  trend?: { direction: "up" | "down"; label: string }
  className?: string
}) {
  return (
    <Card className={cn("shadow-df-sm", className)}>
      <div className="flex items-start justify-between px-1">
        <div className="min-w-0">
          <p className="text-label text-df-text-subtle">{label}</p>
          <p className="text-stat mt-1.5 text-df-text tabular-nums">{value}</p>
          {trend ? (
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trend.direction === "up"
                  ? "bg-df-success-soft text-df-success"
                  : "bg-df-danger-soft text-df-danger"
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {trend.label}
            </span>
          ) : null}
        </div>
        {icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-df-accent-soft text-df-text">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
