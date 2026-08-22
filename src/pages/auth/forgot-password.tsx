import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2Icon, MailIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/layouts/auth-layout"
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth"
import { paths } from "@/routes/paths"

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500))
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-df-success-soft text-df-success">
            <CheckCircle2Icon className="size-6" />
          </div>
          <h1 className="text-h1 mt-4 text-df-text">Check your email</h1>
          <p className="mt-1 text-sm text-df-text-muted">
            If an account exists for that address, we've sent a link to reset your password.
          </p>
          <Button className="mt-6 w-full" render={<Link to={paths.signIn} />}>
            Back to Sign In
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-h1 text-df-text">Forgot password</h1>
      <p className="mt-1 text-sm text-df-text-muted">
        Enter the email on file and we'll send you a reset link.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-df-text-subtle" />
            <Input id="email" type="email" className="pl-8" placeholder="you@dayflow.io" {...register("email")} />
          </div>
          {errors.email && <p className="text-xs text-df-danger">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link to={paths.signIn} className="font-medium text-df-text hover:underline">
          Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
