import { eachDayOfInterval, isWeekend } from "date-fns"

export function countWeekdays(start: Date, end: Date): number {
  if (start > end) return 0
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length
}
