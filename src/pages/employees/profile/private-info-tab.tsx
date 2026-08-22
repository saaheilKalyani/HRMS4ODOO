import type { UseFormRegister } from "react-hook-form"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/format"
import type { ProfileEditValues } from "@/lib/validations/employee"
import type { Employee, EmployeeProfileDetail } from "@/types/domain"

function Field({
  label,
  value,
  isEditing,
  input,
}: {
  label: string
  value: string
  isEditing: boolean
  input?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-df-text-subtle">{label}</Label>
      {isEditing && input ? input : <p className="text-sm text-df-text">{value || "—"}</p>}
    </div>
  )
}

export function PrivateInfoTab({
  employee,
  detail,
  isEditing,
  register,
}: {
  employee: Employee
  detail: EmployeeProfileDetail
  isEditing: boolean
  register?: UseFormRegister<ProfileEditValues>
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Date of birth"
            value={detail.date_of_birth ? formatDate(detail.date_of_birth) : ""}
            isEditing={isEditing}
            input={register && <Input type="date" {...register("date_of_birth")} />}
          />
          <Field
            label="Nationality"
            value={detail.nationality ?? ""}
            isEditing={isEditing}
            input={register && <Input {...register("nationality")} />}
          />
          <Field
            label="Gender"
            value={detail.gender ?? ""}
            isEditing={isEditing}
            input={register && <Input {...register("gender")} />}
          />
          <Field
            label="Marital status"
            value={detail.marital_status ?? ""}
            isEditing={isEditing}
            input={register && <Input {...register("marital_status")} />}
          />
          <Field
            label="Personal email"
            value={detail.personal_email}
            isEditing={isEditing}
            input={register && <Input type="email" {...register("personal_email")} />}
          />
          <Field label="Date of joining" value={formatDate(employee.joining_date)} isEditing={false} />
          <div className="sm:col-span-2">
            <Field
              label="Residing address"
              value={employee.address}
              isEditing={isEditing}
              input={register && <Input {...register("address")} />}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Employee code" value={employee.employee_code} isEditing={false} />
          <Field
            label="Bank name"
            value={detail.bank_name ?? ""}
            isEditing={isEditing}
            input={register && <Input {...register("bank_name")} />}
          />
          <Field
            label="Account number"
            value={detail.bank_account_number ?? ""}
            isEditing={isEditing}
            input={register && <Input {...register("bank_account_number")} />}
          />
          <Field
            label="IFSC code"
            value={detail.ifsc_code ?? ""}
            isEditing={isEditing}
            input={register && <Input {...register("ifsc_code")} />}
          />
          <Field
            label="PAN no."
            value={detail.pan_no ?? ""}
            isEditing={isEditing}
            input={register && <Input {...register("pan_no")} />}
          />
          <Field
            label="UAN no."
            value={detail.uan_no ?? ""}
            isEditing={isEditing}
            input={register && <Input {...register("uan_no")} />}
          />
        </CardContent>
      </Card>
    </div>
  )
}
