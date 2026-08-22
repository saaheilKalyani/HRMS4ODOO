import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2Icon, CopyIcon, PlusIcon } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCreateEmployee } from "@/features/employees/hooks"
import { generateLoginId } from "@/lib/auth/generate-login-id"
import { departments } from "@/lib/constants/departments"
import { newEmployeeSchema, type NewEmployeeValues } from "@/lib/validations/employee"
import type { UserRole } from "@/types/domain"

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "admin", label: "Admin" },
]

export function NewEmployeeSheet() {
  const [open, setOpen] = React.useState(false)
  const [result, setResult] = React.useState<{ loginId: string; tempPassword: string; name: string } | null>(null)
  const createEmployee = useCreateEmployee()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NewEmployeeValues>({
    resolver: zodResolver(newEmployeeSchema),
    defaultValues: { role: "employee" },
  })

  const [firstName, lastName, joiningDate] = watch(["firstName", "lastName", "joiningDate"])
  const preview =
    firstName && lastName && joiningDate ? generateLoginId(firstName, lastName, joiningDate, 1) : null

  const onSubmit = async (values: NewEmployeeValues) => {
    const res = await createEmployee.mutateAsync(values)
    setResult({ loginId: res.loginId, tempPassword: res.tempPassword, name: res.person.employee.full_name })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setTimeout(() => {
        reset()
        setResult(null)
      }, 200)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        New Employee
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        {result ? (
          <div className="flex h-full flex-col">
            <SheetHeader>
              <div className="flex size-11 items-center justify-center rounded-full bg-df-success-soft text-df-success">
                <CheckCircle2Icon className="size-5" />
              </div>
              <SheetTitle className="mt-2">Employee added</SheetTitle>
              <SheetDescription>
                Share these credentials with {result.name}. They can change the password after signing in.
              </SheetDescription>
            </SheetHeader>
            <div className="mx-4 space-y-3 rounded-xl border border-border bg-df-surface-alt p-4">
              <CredentialRow label="Login ID" value={result.loginId} />
              <CredentialRow label="Temporary password" value={result.tempPassword} />
            </div>
            <SheetFooter className="mt-auto">
              <Button className="w-full" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </SheetFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col" noValidate>
            <SheetHeader>
              <SheetTitle>New Employee</SheetTitle>
              <SheetDescription>
                A login ID and temporary password are generated automatically — there's no public sign-up.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" aria-invalid={!!errors.firstName} {...register("firstName")} />
                  {errors.firstName && <p className="text-xs text-df-danger">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" aria-invalid={!!errors.lastName} {...register("lastName")} />
                  {errors.lastName && <p className="text-xs text-df-danger">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
                {errors.email && <p className="text-xs text-df-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" aria-invalid={!!errors.phone} {...register("phone")} />
                {errors.phone && <p className="text-xs text-df-danger">{errors.phone.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select onValueChange={(v) => setValue("department", v as string, { shouldValidate: true })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-xs text-df-danger">{errors.department.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle">Job title</Label>
                  <Input id="jobTitle" aria-invalid={!!errors.jobTitle} {...register("jobTitle")} />
                  {errors.jobTitle && <p className="text-xs text-df-danger">{errors.jobTitle.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="joiningDate">Joining date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    aria-invalid={!!errors.joiningDate}
                    {...register("joiningDate")}
                  />
                  {errors.joiningDate && <p className="text-xs text-df-danger">{errors.joiningDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    defaultValue="employee"
                    onValueChange={(v) => setValue("role", v as UserRole, { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {preview && (
                <div className="rounded-lg bg-df-accent-soft px-3 py-2 text-xs text-df-text">
                  Login ID will be <span className="font-mono font-medium">{preview}</span>
                </div>
              )}
            </div>

            <SheetFooter className="mt-auto flex-row">
              <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
                Discard
              </Button>
              <Button type="submit" className="flex-1" disabled={createEmployee.isPending}>
                {createEmployee.isPending ? "Creating…" : "Create employee"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div>
      <p className="text-label text-df-text-subtle">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="font-mono text-sm text-df-text">{value}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="text-df-text-subtle hover:text-df-text"
          aria-label={`Copy ${label}`}
        >
          {copied ? <CheckCircle2Icon className="size-4 text-df-success" /> : <CopyIcon className="size-4" />}
        </button>
      </div>
    </div>
  )
}
