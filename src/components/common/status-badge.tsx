import { cn } from "@/lib/utils"
import type { AttendanceStatus, LeaveStatus } from "@/types/domain"

export type Tone = "success" | "warning" | "danger" | "info" | "neutral"

const toneClasses: Record<Tone, string> = {
  success: "bg-df-success-soft text-df-success",
  warning: "bg-df-warning-soft text-df-warning",
  danger: "bg-df-danger-soft text-df-danger",
  info: "bg-df-info-soft text-df-info",
  neutral: "bg-muted text-muted-foreground",
}

const dotClasses: Record<Tone, string> = {
  success: "bg-df-success",
  warning: "bg-df-warning",
  danger: "bg-df-danger",
  info: "bg-df-info",
  neutral: "bg-muted-foreground",
}

export function StatusPill({
  tone,
  label,
  className,
}: {
  tone: Tone
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dotClasses[tone])} aria-hidden="true" />
      {label}
    </span>
  )
}

export function StatusDot({ tone, className }: { tone: Tone; className?: string }) {
  return <span className={cn("inline-block size-2.5 rounded-full ring-2 ring-df-surface", dotClasses[tone], className)} />
}

export function attendanceStatusMeta(status: AttendanceStatus): { tone: Tone; label: string } {
  switch (status) {
    case "Present":
      return { tone: "success", label: "Present" }
    case "Absent":
      return { tone: "danger", label: "Absent" }
    case "Half-day":
      return { tone: "warning", label: "Half-day" }
    case "Leave":
      return { tone: "info", label: "On Leave" }
  }
}

export function leaveStatusMeta(status: LeaveStatus): { tone: Tone; label: string } {
  switch (status) {
    case "Pending":
      return { tone: "warning", label: "Pending" }
    case "Approved":
      return { tone: "success", label: "Approved" }
    case "Rejected":
      return { tone: "danger", label: "Rejected" }
  }
}
