import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2Icon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/layouts/auth-layout"
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth"
import { paths } from "@/routes/paths"

export default function ResetPasswordPage() {
  const [done, setDone] = React.useState(false)
  const [show, setShow] = React.useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500))
    setDone(true)
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-df-success-soft text-df-success">
            <CheckCircle2Icon className="size-6" />
          </div>
          <h1 className="text-h1 mt-4 text-df-text">Password updated</h1>
          <p className="mt-1 text-sm text-df-text-muted">You can now sign in with your new password.</p>
          <Button className="mt-6 w-full" render={<Link to={paths.signIn} />}>
            Back to Sign In
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-h1 text-df-text">Set a new password</h1>
      <p className="mt-1 text-sm text-df-text-muted">Choose a strong password you haven't used before.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              className="pr-10"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-df-text-subtle hover:text-df-text"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-df-danger">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type={show ? "text" : "password"}
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-df-danger">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  )
}
