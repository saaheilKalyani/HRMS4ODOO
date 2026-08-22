import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { checkIn, checkOut, getTodayAttendance, listAttendance, type AttendanceFilter } from "@/lib/mock/db"
import { queryKeys } from "@/lib/query-keys"

export function useAttendance(filter: AttendanceFilter = {}) {
  return useQuery({
    queryKey: queryKeys.attendance(filter),
    queryFn: () => listAttendance(filter),
  })
}

export function useTodayAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attendanceToday(employeeId ?? ""),
    queryFn: () => getTodayAttendance(employeeId as string),
    enabled: !!employeeId,
  })
}

export function useCheckIn(employeeId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => checkIn(employeeId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}

export function useCheckOut(employeeId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => checkOut(employeeId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}
