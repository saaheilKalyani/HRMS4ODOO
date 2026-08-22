import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircleIcon, CheckCircle2Icon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/AuthContext"
import { AuthLayout } from "@/layouts/auth-layout"
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth"
import { paths } from "@/routes/paths"

export default function SignupPage() {
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) })

  const onSubmit = async (values: SignUpValues) => {
    setError(null)
    setMessage(null)
    const { data, error: signUpError } = await signUp({
      email: values.email,
      password: values.password,
      full_name: values.fullName,
    })

    if (signUpError) {
      setError(signUpError.message ?? "Something went wrong.")
      return
    }

    setMessage(
      data?.requires_email_verification
        ? "Account created — check your email to verify before signing in."
        : "Account created. You can now sign in."
    )
  }

  if (message) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-df-success-soft text-df-success">
            <CheckCircle2Icon className="size-6" />
          </div>
          <h1 className="text-h1 mt-4 text-df-text">You're all set</h1>
          <p className="mt-1 text-sm text-df-text-muted">{message}</p>
          <Button className="mt-6 w-full" render={<Link to={paths.signIn} />}>
            Back to Sign In
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-h1 text-df-text">Create your account</h1>
      <p className="mt-1 text-sm text-df-text-muted">Sign up to get started with Dayflow.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          {errors.fullName && <p className="text-xs text-df-danger">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-df-danger">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-df-text-subtle hover:text-df-text"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-df-danger">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-df-danger">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-df-danger-soft px-3 py-2.5 text-sm text-df-danger">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Sign Up"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm">
        <span className="text-df-text-muted">Already have an account? </span>
        <Link to={paths.signIn} className="font-medium text-df-text hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
