import { addDays, format, isWeekend, subDays } from "date-fns"

import { people } from "@/lib/mock/people"
import { seededInt, seededRandom } from "@/lib/mock/random"
import { defaultSalaryComponents } from "@/lib/salary/calc"
import type {
  AttendanceRecord,
  LeaveApproval,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  SalaryComponentsDetail,
  SalaryStructure,
} from "@/types/domain"

const dateStr = (d: Date) => format(d, "yyyy-MM-dd")

const atTime = (date: Date, minutesFromMidnight: number): string => {
  const d = new Date(date)
  d.setHours(0, Math.round(minutesFromMidnight), 0, 0)
  return d.toISOString()
}

export const leaveTypes: LeaveType[] = [
  { id: "lt-paid", name: "Paid Leave", description: "Paid time off for personal use", is_active: true },
  { id: "lt-sick", name: "Sick Leave", description: "For illness or medical appointments", is_active: true },
  { id: "lt-unpaid", name: "Unpaid Leave", description: "Leave without pay", is_active: true },
  { id: "lt-casual", name: "Casual Leave", description: "Short-notice personal leave", is_active: true },
]

/** -1 means "no fixed cap" (Unpaid Leave). */
export const leaveAllocations: Record<string, number> = {
  "lt-paid": 24,
  "lt-sick": 7,
  "lt-unpaid": -1,
  "lt-casual": 12,
}

const ADMIN_PROFILE_ID = "profile-01"
const HR_PROFILE_ID = "profile-02"

interface RequestPlan {
  id: string
  employeeId: string
  leaveTypeId: string
  offsetStart: number
  offsetEnd: number
  status: LeaveStatus
  reason: string
  approverId?: string
  comment?: string
}

const requestPlans: RequestPlan[] = [
  { id: "lr-01", employeeId: "emp-01", leaveTypeId: "lt-paid", offsetStart: -40, offsetEnd: -38, status: "approved", reason: "Family function", approverId: HR_PROFILE_ID, comment: "Enjoy the time off." },
  { id: "lr-02", employeeId: "emp-02", leaveTypeId: "lt-casual", offsetStart: -25, offsetEnd: -24, status: "approved", reason: "Personal errand", approverId: ADMIN_PROFILE_ID, comment: "Approved." },
  { id: "lr-03", employeeId: "emp-03", leaveTypeId: "lt-sick", offsetStart: -15, offsetEnd: -14, status: "approved", reason: "Fever, resting at home", approverId: HR_PROFILE_ID, comment: "Get well soon." },
  { id: "lr-04", employeeId: "emp-03", leaveTypeId: "lt-paid", offsetStart: 6, offsetEnd: 8, status: "pending", reason: "Family trip planned in advance" },
  { id: "lr-05", employeeId: "emp-04", leaveTypeId: "lt-paid", offsetStart: -30, offsetEnd: -29, status: "approved", reason: "Wedding in the family", approverId: HR_PROFILE_ID, comment: "Approved, have fun." },
  { id: "lr-06", employeeId: "emp-05", leaveTypeId: "lt-unpaid", offsetStart: -20, offsetEnd: -19, status: "rejected", reason: "Extended personal trip", approverId: ADMIN_PROFILE_ID, comment: "Coverage conflict during sprint — please pick alternate dates." },
  { id: "lr-07", employeeId: "emp-05", leaveTypeId: "lt-sick", offsetStart: -50, offsetEnd: -49, status: "approved", reason: "Flu", approverId: HR_PROFILE_ID, comment: "Approved." },
  { id: "lr-08", employeeId: "emp-06", leaveTypeId: "lt-casual", offsetStart: 3, offsetEnd: 3, status: "pending", reason: "Personal work" },
  { id: "lr-09", employeeId: "emp-07", leaveTypeId: "lt-paid", offsetStart: -1, offsetEnd: 2, status: "approved", reason: "Pre-planned vacation", approverId: HR_PROFILE_ID, comment: "Approved, see you back on the 3rd." },
  { id: "lr-10", employeeId: "emp-08", leaveTypeId: "lt-paid", offsetStart: -35, offsetEnd: -34, status: "approved", reason: "Family event", approverId: ADMIN_PROFILE_ID, comment: "Approved." },
  { id: "lr-11", employeeId: "emp-09", leaveTypeId: "lt-sick", offsetStart: 10, offsetEnd: 11, status: "pending", reason: "Scheduled minor surgery, doctor's note attached" },
  { id: "lr-12", employeeId: "emp-10", leaveTypeId: "lt-unpaid", offsetStart: -10, offsetEnd: -9, status: "rejected", reason: "Extending a weekend trip", approverId: HR_PROFILE_ID, comment: "Insufficient notice for infra on-call coverage." },
  { id: "lr-13", employeeId: "emp-11", leaveTypeId: "lt-paid", offsetStart: -45, offsetEnd: -43, status: "approved", reason: "Annual family vacation", approverId: ADMIN_PROFILE_ID, comment: "Approved." },
  { id: "lr-14", employeeId: "emp-12", leaveTypeId: "lt-casual", offsetStart: -18, offsetEnd: -17, status: "approved", reason: "Moving apartments", approverId: HR_PROFILE_ID, comment: "Approved." },
  { id: "lr-15", employeeId: "emp-13", leaveTypeId: "lt-paid", offsetStart: 5, offsetEnd: 5, status: "pending", reason: "Sister's engagement ceremony" },
]

function buildLeaveData(today: Date) {
  const leaveRequests: LeaveRequest[] = []
  const leaveApprovals: LeaveApproval[] = []

  for (const plan of requestPlans) {
    const start = addDays(today, plan.offsetStart)
    const end = addDays(today, plan.offsetEnd)
    const created = addDays(start, plan.status === "pending" ? -2 : -4)

    leaveRequests.push({
      id: plan.id,
      employee_id: plan.employeeId,
      leave_type_id: plan.leaveTypeId,
      start_date: dateStr(start),
      end_date: dateStr(end),
      reason: plan.reason,
      status: plan.status,
      created_at: created.toISOString(),
      updated_at: (plan.status === "pending" ? created : addDays(start, -1)).toISOString(),
    })

    if (plan.status !== "pending" && plan.approverId) {
      leaveApprovals.push({
        id: `la-${plan.id}`,
        leave_request_id: plan.id,
        approved_by: plan.approverId,
        decision: plan.status,
        comment: plan.comment ?? "",
        created_at: addDays(start, -1).toISOString(),
      })
    }
  }

  return { leaveRequests, leaveApprovals }
}

function isWithinApprovedLeave(
  employeeId: string,
  day: Date,
  leaveRequests: LeaveRequest[]
): boolean {
  const d = dateStr(day)
  return leaveRequests.some(
    (r) =>
      r.employee_id === employeeId &&
      r.status === "approved" &&
      r.start_date <= d &&
      d <= r.end_date
  )
}

function buildAttendance(today: Date, leaveRequests: LeaveRequest[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const windowStart = subDays(today, 45)

  for (const person of people) {
    const employeeId = person.employee.id
    let day = windowStart
    while (day <= today) {
      const isToday = dateStr(day) === dateStr(today)
      if (!isWeekend(day)) {
        const onLeave = isWithinApprovedLeave(employeeId, day, leaveRequests)

        if (onLeave) {
          records.push({
            id: `att-${employeeId}-${dateStr(day)}`,
            employee_id: employeeId,
            attendance_date: dateStr(day),
            check_in: null,
            check_out: null,
            status: "leave",
            total_hours: null,
            created_at: day.toISOString(),
            updated_at: day.toISOString(),
          })
        } else if (!isToday) {
          const seed = `${employeeId}-${dateStr(day)}`
          const roll = seededRandom(`${seed}-status`)
          const status = roll < 0.05 ? "absent" : roll < 0.1 ? "half_day" : "present"

          if (status === "absent") {
            records.push({
              id: `att-${seed}`,
              employee_id: employeeId,
              attendance_date: dateStr(day),
              check_in: null,
              check_out: null,
              status: "absent",
              total_hours: 0,
              created_at: day.toISOString(),
              updated_at: day.toISOString(),
            })
          } else {
            const inMin = seededInt(`${seed}-in`, 8 * 60 + 45, 9 * 60 + 40)
            const outMin =
              status === "half_day"
                ? inMin + seededInt(`${seed}-out`, 210, 270)
                : seededInt(`${seed}-out`, 17 * 60 + 45, 19 * 60 + 10)
            const totalHours = Math.round(((outMin - inMin) / 60) * 100) / 100

            records.push({
              id: `att-${seed}`,
              employee_id: employeeId,
              attendance_date: dateStr(day),
              check_in: atTime(day, inMin),
              check_out: atTime(day, outMin),
              status,
              total_hours: totalHours,
              created_at: day.toISOString(),
              updated_at: day.toISOString(),
            })
          }
        }
        // isToday && !onLeave: intentionally left unrecorded so the live
        // check-in/check-out flow has something to do in the demo.
      }
      day = addDays(day, 1)
    }
  }

  return records
}

function buildLeaveBalances(leaveRequests: LeaveRequest[]): LeaveBalance[] {
  const balances: LeaveBalance[] = []
  for (const person of people) {
    for (const type of leaveTypes) {
      const usedDays = leaveRequests
        .filter(
          (r) =>
            r.employee_id === person.employee.id &&
            r.leave_type_id === type.id &&
            r.status === "approved"
        )
        .reduce((sum, r) => {
          const days =
            (new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) /
              (1000 * 60 * 60 * 24) +
            1
          return sum + days
        }, 0)

      balances.push({
        employee_id: person.employee.id,
        leave_type_id: type.id,
        allocated_days: leaveAllocations[type.id] ?? 0,
        used_days: usedDays,
      })
    }
  }
  return balances
}

const monthWages: Record<string, number> = {
  "emp-01": 180000,
  "emp-02": 95000,
  "emp-03": 72000,
  "emp-04": 78000,
  "emp-05": 150000,
  "emp-06": 55000,
  "emp-07": 68000,
  "emp-08": 62000,
  "emp-09": 90000,
  "emp-10": 85000,
  "emp-11": 145000,
  "emp-12": 130000,
  "emp-13": 50000,
}

function buildSalary(): { structures: SalaryStructure[]; details: SalaryComponentsDetail[] } {
  const structures: SalaryStructure[] = []
  const details: SalaryComponentsDetail[] = []

  for (const person of people) {
    const employeeId = person.employee.id
    const monthWage = monthWages[employeeId] ?? 50000
    const bonus = Math.round((monthWage * 0.04) / 100) * 100
    const components = defaultSalaryComponents(monthWage, bonus)

    const basic = components.find((c) => c.key === "basic")?.value ?? 0
    const fixedAllowance = components.find((c) => c.key === "fixed_allowance")?.value ?? 0
    const allowances = components
      .filter((c) => c.key !== "basic")
      .reduce((sum, c) => sum + c.value, 0)
    const pfEmployee = Math.round(((basic * 12) / 100) * 100) / 100
    const professionalTax = 200

    details.push({
      employee_id: employeeId,
      wage_type: "fixed",
      month_wage: monthWage,
      working_days_per_week: 5,
      break_time_hours: 1,
      components,
      pf_employee_percent: 12,
      pf_employer_percent: 12,
      professional_tax: professionalTax,
    })

    structures.push({
      id: `sal-${employeeId}`,
      employee_id: employeeId,
      basic_salary: basic,
      allowances: Math.round(allowances * 100) / 100,
      deductions: Math.round((pfEmployee + professionalTax) * 100) / 100,
      net_salary: Math.round((monthWage - pfEmployee - professionalTax) * 100) / 100,
      effective_from: person.employee.joining_date,
      created_at: person.employee.joining_date,
      updated_at: person.employee.joining_date,
    })

    void fixedAllowance
  }

  return { structures, details }
}

export interface SeedBundle {
  attendanceRecords: AttendanceRecord[]
  leaveRequests: LeaveRequest[]
  leaveApprovals: LeaveApproval[]
  leaveBalances: LeaveBalance[]
  salaryStructures: SalaryStructure[]
  salaryComponentsDetails: SalaryComponentsDetail[]
}

export function buildSeed(today: Date = new Date()): SeedBundle {
  const { leaveRequests, leaveApprovals } = buildLeaveData(today)
  const attendanceRecords = buildAttendance(today, leaveRequests)
  const leaveBalances = buildLeaveBalances(leaveRequests)
  const { structures, details } = buildSalary()

  return {
    attendanceRecords,
    leaveRequests,
    leaveApprovals,
    leaveBalances,
    salaryStructures: structures,
    salaryComponentsDetails: details,
  }
}
