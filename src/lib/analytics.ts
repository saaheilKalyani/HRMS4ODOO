import { format, startOfWeek, subWeeks } from "date-fns"

import type { AttendanceRecord } from "@/types/domain"

export interface WeeklyAttendanceBucket {
  label: string
  present: number
  away: number
}

export function weeklyAttendanceBuckets(
  records: AttendanceRecord[],
  weeksCount = 6,
  today: Date = new Date()
): WeeklyAttendanceBucket[] {
  const buckets: WeeklyAttendanceBucket[] = []

  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 })
    const weekStartStr = format(weekStart, "yyyy-MM-dd")
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = format(weekEnd, "yyyy-MM-dd")

    const inWeek = records.filter(
      (r) => r.attendance_date >= weekStartStr && r.attendance_date <= weekEndStr
    )
    const present = inWeek.filter((r) => r.status === "present").length
    const away = inWeek.filter((r) => r.status !== "present").length

    buckets.push({ label: format(weekStart, "MMM d"), present, away })
  }

  return buckets
}
