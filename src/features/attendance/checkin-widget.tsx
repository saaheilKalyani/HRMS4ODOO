import * as React from "react"
import { LogInIcon, LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCheckIn, useCheckOut, useTodayAttendance } from "@/features/attendance/hooks"
import { useAuth } from "@/features/auth/AuthContext"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

function useElapsed(since: string | null) {
  const [, force] = React.useReducer((c) => c + 1, 0)
  React.useEffect(() => {
    if (!since) return
    const id = setInterval(force, 30_000)
    return () => clearInterval(id)
  }, [since])

  if (!since) return null
  const ms = Date.now() - new Date(since).getTime()
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${m}m`
}

export function CheckInOutWidget({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const employeeId = user?.employee.id
  const { data: today } = useTodayAttendance(employeeId)
  const checkIn = useCheckIn(employeeId)
  const checkOut = useCheckOut(employeeId)
  const elapsed = useElapsed(today?.check_in ?? null)

  if (!user) return null

  const hasCheckedIn = !!today?.check_in
  const hasCheckedOut = !!today?.check_out

  if (hasCheckedOut) {
    return (
      <div className={cn("flex items-center gap-2 rounded-full bg-df-success-soft px-3 py-1.5 text-xs font-medium text-df-success", compact && "px-2.5")}>
        <span className="size-1.5 rounded-full bg-df-success" />
        Done for today · {formatTime(today.check_in)} – {formatTime(today.check_out)}
      </div>
    )
  }

  if (hasCheckedIn) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-[11px] text-df-text-subtle">Since {formatTime(today.check_in)}</span>
          <span className="text-xs font-medium text-df-success tabular-nums">{elapsed} elapsed</span>
        </div>
        <Button
          size={compact ? "sm" : "default"}
          variant="outline"
          onClick={() => checkOut.mutate()}
          disabled={checkOut.isPending}
        >
          <LogOutIcon data-icon="inline-start" />
          {checkOut.isPending ? "Checking out…" : "Check Out"}
        </Button>
      </div>
    )
  }

  return (
    <Button
      size={compact ? "sm" : "default"}
      onClick={() => checkIn.mutate()}
      disabled={checkIn.isPending}
    >
      <LogInIcon data-icon="inline-start" />
      {checkIn.isPending ? "Checking in…" : "Check In"}
    </Button>
  )
}
