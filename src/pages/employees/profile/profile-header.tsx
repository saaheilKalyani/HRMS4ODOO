import { AvatarInitials } from "@/components/common/avatar-initials"
import { CoreEditDialog } from "@/pages/employees/profile/core-edit-dialog"
import type { Employee, EmployeeProfileDetail } from "@/types/domain"

const statusMeta: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-df-success-soft text-df-success" },
  on_leave: { label: "On Leave", className: "bg-df-info-soft text-df-info" },
  inactive: { label: "Inactive", className: "bg-df-warning-soft text-df-warning" },
  terminated: { label: "Terminated", className: "bg-df-danger-soft text-df-danger" },
}

export function ProfileHeader({
  employee,
  detail,
  email,
  canEditCore,
}: {
  employee: Employee
  detail: EmployeeProfileDetail
  email: string
  canEditCore: boolean
}) {
  const status = statusMeta[employee.employment_status]

  return (
    <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-border bg-df-surface p-6 shadow-df-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <AvatarInitials name={employee.full_name} size="lg" className="size-16 text-lg" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1 text-df-text">{employee.full_name}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-df-text-muted">{employee.job_title}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-df-text-subtle">
            <span>{email}</span>
            <span>{employee.phone}</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-1">
          <div>
            <dt className="text-xs text-df-text-subtle">Company</dt>
            <dd className="text-df-text">{detail.company_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-df-text-subtle">Department</dt>
            <dd className="text-df-text">{employee.department}</dd>
          </div>
          <div>
            <dt className="text-xs text-df-text-subtle">Manager</dt>
            <dd className="text-df-text">{detail.manager_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-df-text-subtle">Location</dt>
            <dd className="text-df-text">{detail.location || "—"}</dd>
          </div>
        </dl>
        {canEditCore && <CoreEditDialog employee={employee} />}
      </div>
    </div>
  )
}
