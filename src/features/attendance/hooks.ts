import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  checkIn as checkInReal,
  checkOut as checkOutReal,
  getAttendance as getAttendanceReal,
  getMyAttendance as getMyAttendanceReal,
  getTodayAttendance as getTodayAttendanceReal,
} from "@/features/attendance/attendance.service"
import { queryKeys } from "@/lib/query-keys"
import type { AttendanceRecord, AttendanceStatus } from "@/types/domain"

export interface AttendanceFilter {
  employeeId?: string
  from?: string
  to?: string
  status?: AttendanceStatus
}

/**
 * When `employeeId` is passed, this is a self-view (every real caller passes
 * their own employee id) — routed to getMyAttendance(), which derives the
 * caller's employee_id from the session server-side; the employeeId param
 * itself is not forwarded, it's redundant with the session. When omitted,
 * this is an admin "all employees" view — routed to the admin-only
 * getAttendance(), enforced both client-side and by RLS.
 */
export function useAttendance(filter: AttendanceFilter = {}) {
  return useQuery({
    queryKey: queryKeys.attendance(filter),
    queryFn: async (): Promise<AttendanceRecord[]> => {
      const { data, error } = filter.employeeId
        ? await getMyAttendanceReal({ from: filter.from, to: filter.to, status: filter.status })
        : await getAttendanceReal({ from: filter.from, to: filter.to, status: filter.status })
      if (error) throw new Error(error.message)
      return (data ?? []) as unknown as AttendanceRecord[]
    },
  })
}

export function useTodayAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attendanceToday(employeeId ?? ""),
    queryFn: async (): Promise<AttendanceRecord | null> => {
      const { data, error } = await getTodayAttendanceReal()
      if (error) throw new Error(error.message)
      return (data as unknown as AttendanceRecord) ?? null
    },
    enabled: !!employeeId,
  })
}

export function useCheckIn(employeeId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      void employeeId
      const { data, error } = await checkInReal()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}

export function useCheckOut(employeeId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      void employeeId
      const { data, error } = await checkOutReal()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}
