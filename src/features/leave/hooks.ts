import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  listAllLeaveBalances,
  listLeaveBalances,
  type DecideLeaveInput,
} from "@/lib/mock/db"
import {
  getLeaveTypes as getLeaveTypesReal,
} from "@/features/leave/leave-type.service"
import {
  createLeaveRequest as createLeaveRequestReal,
  getLeaveRequests as getLeaveRequestsReal,
  getMyLeaveRequests as getMyLeaveRequestsReal,
} from "@/features/leave/leave-request.service"
import { approveLeave, rejectLeave } from "@/features/leave/leave-approval.service"
import { queryKeys } from "@/lib/query-keys"
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/types/domain"

export function useLeaveTypes() {
  return useQuery({
    queryKey: queryKeys.leaveTypes,
    queryFn: async (): Promise<LeaveType[]> => {
      const { data, error } = await getLeaveTypesReal()
      if (error) throw new Error(error.message)
      return (data ?? []) as unknown as LeaveType[]
    },
  })
}

export interface LeaveRequestFilter {
  employeeId?: string
  status?: LeaveStatus
}

/**
 * Same self-vs-admin split as attendance: employeeId present => self-view,
 * routed to getMyLeaveRequests() (session-scoped); omitted => admin
 * "everyone" view, routed to the admin-only getLeaveRequests().
 */
export function useLeaveRequests(filter: LeaveRequestFilter = {}) {
  return useQuery({
    queryKey: queryKeys.leaveRequests(filter),
    queryFn: async (): Promise<LeaveRequest[]> => {
      const { data, error } = filter.employeeId
        ? await getMyLeaveRequestsReal({ status: filter.status })
        : await getLeaveRequestsReal({ status: filter.status })
      if (error) throw new Error(error.message)
      return (data ?? []) as unknown as LeaveRequest[]
    },
  })
}

/**
 * No real backing table for leave balances/allocations exists anywhere in
 * the deployed schema (only leave_types, leave_requests, leave_approvals) —
 * this stays on mock data intentionally, not overlooked. Flagged clearly
 * rather than fabricating numbers against a nonexistent table.
 */
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

export interface NewLeaveRequestInput {
  employeeId?: string
  leaveTypeId: string
  startDate: string
  endDate: string
  reason?: string
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewLeaveRequestInput) => {
      const { data, error } = await createLeaveRequestReal({
        leave_type_id: input.leaveTypeId,
        start_date: input.startDate,
        end_date: input.endDate,
        reason: input.reason,
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] })
    },
  })
}

/**
 * Kept as a single hook (matching the mock's shape) that branches to the
 * real approveLeave()/rejectLeave() RPC calls based on input.decision — this
 * means decision-dialog.tsx (the live approve/reject UI) needed no changes
 * at all. `approverId` is accepted for source compatibility but ignored:
 * the RPC derives the approver from the session (auth.uid()) server-side,
 * the same "never trust client-supplied identity" pattern used everywhere
 * else in this project.
 */
export function useDecideLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DecideLeaveInput) => {
      const decideFn = input.decision === "Approved" ? approveLeave : rejectLeave
      const { data, error } = await decideFn({
        leave_request_id: input.requestId,
        comment: input.comment,
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] })
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}
