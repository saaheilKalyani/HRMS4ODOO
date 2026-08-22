import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/AuthContext"
import { AuthLayout } from "@/layouts/auth-layout"
import { emailSignInSchema, type EmailSignInValues } from "@/lib/validations/auth"
import { paths } from "@/routes/paths"

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailSignInValues>({ resolver: zodResolver(emailSignInSchema) })

  const onSubmit = async (values: EmailSignInValues) => {
    setError(null)
    const { error: signInError } = await signIn(values)
    if (signInError) {
      setError(signInError.message ?? "Invalid email or password.")
      return
    }
    const from = (location.state as { from?: Location })?.from?.pathname ?? paths.dashboard
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout>
      <h1 className="text-h1 text-df-text">Welcome back</h1>
      <p className="mt-1 text-sm text-df-text-muted">Sign in to your Dayflow account.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link to={paths.forgotPassword} className="text-xs font-medium text-df-text-muted hover:text-df-text">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-df-danger-soft px-3 py-2.5 text-sm text-df-danger">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm">
        <span className="text-df-text-muted">Don't have an account? </span>
        <Link to={paths.signUp} className="font-medium text-df-text hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  )
}
