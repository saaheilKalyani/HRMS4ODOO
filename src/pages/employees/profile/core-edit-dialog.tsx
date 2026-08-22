import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateEmployee } from "@/features/employees/hooks"
import { departments } from "@/lib/constants/departments"
import { employeeCoreEditSchema, type EmployeeCoreEditValues } from "@/lib/validations/employee"
import type { Employee, EmploymentStatus } from "@/types/domain"

const statusOptions: { value: EmploymentStatus; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
]

export function CoreEditDialog({ employee }: { employee: Employee }) {
  const [open, setOpen] = React.useState(false)
  const update = useUpdateEmployee(employee.id)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeCoreEditValues>({
    resolver: zodResolver(employeeCoreEditSchema),
    defaultValues: {
      phone: employee.phone ?? "",
      department: employee.department ?? "",
      jobTitle: employee.job_title ?? "",
      employmentStatus: employee.employment_status,
    },
  })
  const department = watch("department")
  const employmentStatus = watch("employmentStatus")

  const onSubmit = async (values: EmployeeCoreEditValues) => {
    await update.mutateAsync({
      phone: values.phone,
      department: values.department,
      job_title: values.jobTitle,
      employment_status: values.employmentStatus,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PencilIcon data-icon="inline-start" />
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Edit employee record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-xs text-df-danger">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={department} onValueChange={(v) => setValue("department", v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input id="jobTitle" {...register("jobTitle")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Employment status</Label>
              <Select
                value={employmentStatus}
                onValueChange={(v) => setValue("employmentStatus", v as EmploymentStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
