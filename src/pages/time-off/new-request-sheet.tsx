import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PaperclipIcon, PlusIcon } from "lucide-react"
import { useForm } from "react-hook-form"

import { AvatarInitials } from "@/components/common/avatar-initials"
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
import { Textarea } from "@/components/ui/textarea"
import { useCreateLeaveRequest, useLeaveTypes } from "@/features/leave/hooks"
import { useAuth } from "@/features/auth/AuthContext"
import { daysBetweenInclusive } from "@/lib/format"
import { leaveRequestSchema, type LeaveRequestValues } from "@/lib/validations/leave"

export function NewRequestSheet() {
  const { user } = useAuth()
  const { data: leaveTypes = [] } = useLeaveTypes()
  const createRequest = useCreateLeaveRequest()
  const [open, setOpen] = React.useState(false)
  const [attachment, setAttachment] = React.useState<string | null>(null)
  const [attachmentError, setAttachmentError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestValues>({ resolver: zodResolver(leaveRequestSchema) })

  const [leaveTypeId, startDate, endDate] = watch(["leaveTypeId", "startDate", "endDate"])
  const selectedType = leaveTypes.find((t) => t.id === leaveTypeId)
  const isSick = selectedType?.name.toLowerCase().includes("sick")
  const allocation = startDate && endDate && startDate <= endDate ? daysBetweenInclusive(startDate, endDate) : 0

  const onSubmit = async (values: LeaveRequestValues) => {
    if (isSick && !attachment) {
      setAttachmentError("Attach a sick leave certificate to continue.")
      return
    }
    if (!user) return
    await createRequest.mutateAsync({
      employeeId: user.employee.id,
      leaveTypeId: values.leaveTypeId,
      startDate: values.startDate,
      endDate: values.endDate,
      reason: values.reason,
    })
    handleOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setTimeout(() => {
        reset()
        setAttachment(null)
        setAttachmentError(null)
      }, 200)
    }
  }

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        New
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col" noValidate>
          <SheetHeader>
            <SheetTitle>Time off Request</SheetTitle>
            <SheetDescription>Submit a new request for approval.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-df-surface-alt px-2.5 py-1.5">
                <AvatarInitials name={user.profile.display_name} size="sm" />
                <span className="text-sm text-df-text">{user.profile.display_name}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Time off type</Label>
              <Select onValueChange={(v) => setValue("leaveTypeId", v as string, { shouldValidate: true })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leaveTypeId && <p className="text-xs text-df-danger">{errors.leaveTypeId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Validity period</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" aria-invalid={!!errors.startDate} {...register("startDate")} />
                <Input type="date" aria-invalid={!!errors.endDate} {...register("endDate")} />
              </div>
              {errors.endDate && <p className="text-xs text-df-danger">{errors.endDate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Allocation</Label>
              <Input value={allocation ? `${allocation} day${allocation > 1 ? "s" : ""}` : "—"} disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Remarks</Label>
              <Textarea id="reason" rows={3} {...register("reason")} placeholder="Add a short reason…" />
              {errors.reason && <p className="text-xs text-df-danger">{errors.reason.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>
                Attachment {isSick && <span className="text-df-danger">(required for sick leave)</span>}
              </Label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-df-text-muted hover:bg-df-surface-alt">
                <PaperclipIcon className="size-4 shrink-0" />
                <span className="truncate">{attachment ?? "Attach sick leave certificate (optional)"}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    setAttachment(e.target.files?.[0]?.name ?? null)
                    setAttachmentError(null)
                  }}
                />
              </label>
              {attachmentError && <p className="text-xs text-df-danger">{attachmentError}</p>}
            </div>
          </div>

          <SheetFooter className="mt-auto flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
              Discard
            </Button>
            <Button type="submit" className="flex-1" disabled={createRequest.isPending}>
              {createRequest.isPending ? "Submitting…" : "Submit"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
