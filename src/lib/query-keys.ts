export const queryKeys = {
  people: ["people"] as const,
  person: (employeeId: string) => ["people", employeeId] as const,
  attendance: (filter?: { employeeId?: string; from?: string; to?: string }) =>
    ["attendance", filter ?? {}] as const,
  attendanceToday: (employeeId: string) => ["attendance", "today", employeeId] as const,
  leaveTypes: ["leave-types"] as const,
  leaveRequests: (filter?: { employeeId?: string; status?: string }) =>
    ["leave-requests", filter ?? {}] as const,
  leaveBalances: (employeeId: string) => ["leave-balances", employeeId] as const,
  salaryComponents: (employeeId: string) => ["salary-components", employeeId] as const,
  salaryStructure: (employeeId: string) => ["salary-structure", employeeId] as const,
}
