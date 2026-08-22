import { z } from "zod"

export const signInSchema = z.object({
  loginId: z.string().min(1, "Enter your login ID or email"),
  password: z.string().min(1, "Enter your password"),
})
export type SignInValues = z.infer<typeof signInSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email address"),
})
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
