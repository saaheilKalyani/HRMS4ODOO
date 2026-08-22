import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createLeaveRequest,
  decideLeaveRequest,
  listAllLeaveBalances,
  listLeaveBalances,
  listLeaveRequests,
  listLeaveTypes,
  type DecideLeaveInput,
  type LeaveRequestFilter,
  type NewLeaveRequestInput,
} from "@/lib/mock/db"
import { queryKeys } from "@/lib/query-keys"

export function useLeaveTypes() {
  return useQuery({ queryKey: queryKeys.leaveTypes, queryFn: listLeaveTypes })
}

export function useLeaveRequests(filter: LeaveRequestFilter = {}) {
  return useQuery({
    queryKey: queryKeys.leaveRequests(filter),
    queryFn: () => listLeaveRequests(filter),
  })
}

export function useLeaveBalances(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leaveBalances(employeeId ?? ""),
    queryFn: () => listLeaveBalances(employeeId as string),
    enabled: !!employeeId,
  })
}

export function useAllLeaveBalances() {
  return useQuery({ queryKey: ["leave-balances", "all"], queryFn: listAllLeaveBalances })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewLeaveRequestInput) => createLeaveRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] })
    },
  })
}

export function useDecideLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DecideLeaveInput) => decideLeaveRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] })
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}
