import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useDecideLeaveRequest } from "@/features/leave/hooks"
import { useAuth } from "@/features/auth/auth-context"
import { decisionCommentSchema, type DecisionCommentValues } from "@/lib/validations/leave"
import type { LeaveDecision } from "@/types/domain"

export function DecisionDialog({
  requestId,
  employeeName,
  decision,
  open,
  onOpenChange,
}: {
  requestId: string
  employeeName: string
  decision: LeaveDecision
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user } = useAuth()
  const decide = useDecideLeaveRequest()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DecisionCommentValues>({ resolver: zodResolver(decisionCommentSchema) })

  const onSubmit = async (values: DecisionCommentValues) => {
    if (!user) return
    await decide.mutateAsync({ requestId, decision, comment: values.comment, approverId: user.profile.id })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{decision === "approved" ? "Approve" : "Reject"} request</DialogTitle>
            <DialogDescription>
              {decision === "approved" ? "Approve" : "Reject"} {employeeName}'s leave request and leave a comment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              rows={3}
              autoFocus
              placeholder={decision === "approved" ? "e.g. Approved, enjoy the time off." : "e.g. Coverage conflict, please pick different dates."}
              aria-invalid={!!errors.comment}
              {...register("comment")}
            />
            {errors.comment && <p className="mt-1 text-xs text-df-danger">{errors.comment.message}</p>}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="w-full"
              variant={decision === "rejected" ? "destructive" : "default"}
              disabled={decide.isPending}
            >
              {decide.isPending ? "Saving…" : decision === "approved" ? "Confirm approval" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
