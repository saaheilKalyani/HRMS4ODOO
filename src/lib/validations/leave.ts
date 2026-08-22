import { z } from "zod"

export const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Select a leave type"),
    startDate: z.string().min(1, "Required"),
    endDate: z.string().min(1, "Required"),
    reason: z.string().min(1, "Add a short reason"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be on or before end date",
    path: ["endDate"],
  })
export type LeaveRequestValues = z.infer<typeof leaveRequestSchema>

export const decisionCommentSchema = z.object({
  comment: z.string().min(1, "Add a comment for the employee"),
})
export type DecisionCommentValues = z.infer<typeof decisionCommentSchema>
